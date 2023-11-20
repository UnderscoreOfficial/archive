from django.shortcuts import render, redirect, get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import HttpResponseRedirect
from .models import Movie, TvShow, TvShowSeason, NewEpisodes, NextDateToCheckEpisodes, StorageSpace, NewFiles, Lengths
from .forms import MovieForm, TvShowForm, TvShowSeasonForm, UnacquiredMovieForm, StorageSpaceForm
from .serializers import MovieSerializer, TvShowSerializer, TvShowSeasonSerializer, StorageSpaceSerializer
from .serializers import MovieSerializerForm, NewFilesSerializer, TvShowSeasonSerializerForm, StorageSpaceSerializerForm
from .serializers import ListSerializer, UnacquiredTvShowSerializer, UnacquiredMovieSerializer, LengthsSerializer
from django.db.models import Q, Count, Sum
from .functions import NewEpisodesCheck, Filtering, ContentLength
from django.utils import timezone
from datetime import timedelta, datetime
from django.http import Http404
import asyncio
from queryset_sequence import QuerySetSequence
from django.core.paginator import Paginator
import subprocess
import json
import time
from pathlib import Path
from .rename import Rename
import re


def home(request, tab: str):
    match tab:
        case "can-rewatch":
            combined_content = QuerySetSequence(Movie.objects.all(), TvShow.objects.all()).filter(watched=True)
            context = {"combined_content": combined_content}
            return render(request, "home_tabs/can_rewatch.html", context)

        case "not-seen":
            combined_content = QuerySetSequence(Movie.objects.all(), TvShow.objects.all()).filter(
                watched=False, unacquired=False)
            context = {"combined_content": combined_content}
            return render(request, "home_tabs/not_seen.html", context)
        case _:
            tv_shows = TvShow.objects.all()
            t1 = time.time()
            asyncio.run(NewEpisodesCheck.checkForNewEpisodes())
            t2 = time.time()
            print(f"Checking For New Episodes Took: {t2-t1}s")

            new_episodes = NewEpisodes.objects.filter(tv_show_id__unacquired=False).values(
                "tv_show_id").annotate(total_episodes=Count("episode"))

            context = {"tv_shows": tv_shows, "new_episodes": new_episodes}
            return render(request, "home_tabs/new_episodes.html", context)


def search(request):
    context = {"tv_shows": TvShow.objects.filter(unacquired=False).order_by("-created")}
    return render(request, "search.html", context)


def stats(request):
    t1 = time.time()
    asyncio.run(ContentLength.checkLengths())
    t2 = time.time()

    print(f"Checking lengths Took: {t2-t1}s")

    # -objects
    tv_show_objects = TvShow.objects.all()
    tv_show_season_objects = TvShowSeason.objects.all()
    movie_objects = Movie.objects.all()
    storage_space_objects = StorageSpace.objects.all()
    lengths = Lengths.objects.filter(unacquired=False, watched=False).order_by("-length")

    # -counts
    counts = {
        "movies": {
            "count": len(movie_objects.filter(unacquired=False)),
            "size": movie_objects.filter(unacquired=False).aggregate(Sum("size"))["size__sum"],
            "median": 0,
            "average": 0
        },
        "tv_shows": {
            "count": len(tv_show_objects.filter(unacquired=False)),
            "seasons": len(tv_show_season_objects),
            "size": tv_show_season_objects.aggregate(Sum("size"))["size__sum"],
            "median": 0,
            "average": 0
        },
        "movies_tv_shows": {
            "count": 0,
            "size": 0,
            "median": 0,
            "average": 0
        },
        "unacquired": {
            "count": len(QuerySetSequence(tv_show_objects, movie_objects).filter(unacquired=True))
        }
    }

    # set movies_tv_shows
    counts["movies_tv_shows"]["count"] = counts["movies"]["count"]+counts["tv_shows"]["count"]
    counts["movies_tv_shows"]["size"] = counts["movies"]["size"]+counts["tv_shows"]["size"]

    # set averages
    counts["movies"]["average"] = counts["movies"]["size"]/counts["movies"]["count"]
    counts["tv_shows"]["average"] = counts["tv_shows"]["size"]/counts["tv_shows"]["count"]
    counts["movies_tv_shows"]["average"] = counts["movies_tv_shows"]["size"]/counts["movies_tv_shows"]["count"]

    # -drives

    raw_drive_data = subprocess.check_output(["drive-size"], shell=True)

    drives = []
    drive_info_split = str(raw_drive_data).split("\\n")[1:-2]
    for drive in drive_info_split:
        drive = drive.split(" ")
        while "" in drive:
            drive.remove("")
        for data in storage_space_objects:
            pass
            if data.drive_path == drive[-1]:
                drives.append({"id": data.id,
                               "name": data.drive_name,
                               "path": data.drive_path,
                               "type": data.drive_type,
                               "capacity": data.drive_space,
                               "used_space": drive[-3].replace("GB", ""),
                               "hidden": data.hidden
                               })

    # -medians

    temp = movie_objects.filter(unacquired=False).order_by("-size")
    if counts["movies"]["count"] % 2 == 0:
        temp_1 = temp[int(counts["movies"]["count"]/2)].size
        temp_2 = temp[int(counts["movies"]["count"]/2)+1].size
        counts["movies"]["median"] = (temp_1+temp_2) / 2
    else:
        counts["movies"]["median"] = temp[int((counts["movies"]["count"]-1)/2)+1].size

    temp = tv_show_objects.filter(unacquired=False).order_by("-size")
    if counts["tv_shows"]["count"] % 2 == 0:
        temp_1 = temp[int(counts["tv_shows"]["count"]/2)].size
        temp_2 = temp[int(counts["tv_shows"]["count"]/2)+1].size
        counts["tv_shows"]["median"] = (temp_1+temp_2) / 2
    else:
        counts["tv_shows"]["median"] = temp[int((counts["tv_shows"]["count"]-1)/2)+1].size

    temp = QuerySetSequence(tv_show_objects, movie_objects).filter(unacquired=False).order_by("-size")
    if counts["movies_tv_shows"]["count"] % 2 == 0:
        temp_1 = temp[int(counts["movies_tv_shows"]["count"]/2)].size
        temp_2 = temp[int(counts["movies_tv_shows"]["count"]/2)+1].size
        counts["movies_tv_shows"]["median"] = (temp_1+temp_2) / 2
    else:
        counts["movies_tv_shows"]["median"] = temp[int((counts["movies_tv_shows"]["count"]-1)/2)+1].size

    # -totals

    # used space
    drive_temp = str(raw_drive_data).split("\\n")[-2].split(" ")
    while "" in drive_temp:
        drive_temp.remove("")
    used_space = drive_temp[-4].replace("GB", "")

    # available space
    temp = 0
    for drive in drives:
        temp += drive["capacity"]
    available_space = float(temp)-float(used_space)

    totals = {
        "watched": len(movie_objects.filter(watched=True))+len(tv_show_objects.filter(watched=True)),
        "not_watched": len(movie_objects.filter(watched=False))+len(tv_show_objects.filter(watched=False)),
        "used_space": used_space,
        "available_space": available_space
    }

    context = {
        "form": StorageSpaceForm(),
        "drives": drives,
        "counts": counts,
        "totals": totals,
        "lengths": lengths
    }
    return render(request, "stats.html", context)


# detail #
def tvShowDetail(request, pk: int, unique_id: str = None):
    tv_show = get_object_or_404(TvShow, id=pk)
    if unique_id != tv_show.unique_id:
        return redirect("tv_show_detail", pk=pk, unique_id=tv_show.unique_id)
    seasons = TvShowSeason.objects.filter(tv_show=tv_show.id).order_by("season")

    if tv_show.unacquired == True:
        raise Http404("Page not found")

    season_forms = [TvShowSeasonForm(instance=season) for season in seasons]
    tv_show_form = TvShowForm(instance=tv_show)

    new_episodes_count = NewEpisodes.objects.filter(tv_show_id=tv_show.id).values(
        "tv_show_id").annotate(total_episodes=Count("episode"))

    print(new_episodes_count)

    new_episodes = NewEpisodes.objects.filter(tv_show_id=tv_show.id)

    context = {"tv_show": tv_show, "tv_show_form": tv_show_form, "season_forms": season_forms,
               "seasons": seasons, "new_episodes_count": new_episodes_count, "new_episodes": new_episodes}
    return render(request, "detail/tv_show_detail.html", context)


def movieDetail(request, pk: int, unique_id: str = None):
    movie = get_object_or_404(Movie, id=pk)
    if unique_id != movie.unique_id:
        return redirect("movie_detail", pk=pk, unique_id=movie.unique_id)

    if movie.unacquired == True:
        raise Http404("Page not found")

    form = MovieForm(instance=movie)
    if movie.last_watched_date != None:
        iso_date = datetime.fromisoformat(str(movie.last_watched_date))
        movie_last_watched_date = iso_date.strftime("%B %e, %Y")
    else:
        movie_last_watched_date = None

    context = {"movie": movie, "form": form, "movie_last_watched_date": movie_last_watched_date}
    return render(request, "detail/movie_detail.html", context)


def unacquiredContentDetail(request, pk: int, type: str, unique_id: str = None):
    if type == "tv-show":
        unacquired_content = get_object_or_404(TvShow, id=pk)
        form = TvShowForm(instance=unacquired_content)
    elif type == "movie":
        unacquired_content = get_object_or_404(Movie, id=pk)
        form = MovieForm(instance=unacquired_content)
    else:
        raise Http404("Page not found")

    if unique_id != unacquired_content.unique_id:
        return redirect("unacquired_content_detail", type=type, pk=pk, unique_id=unacquired_content.unique_id)

    if unacquired_content.unacquired == False:
        raise Http404("Page not found")

    context = {"unacquired_content": unacquired_content, "form": form}
    return render(request, "detail/unacquired_content_detail.html", context)


# add #


def addMovie(request):
    form = MovieForm()

    if request.method == "POST":
        form = MovieForm(request.POST)
        if form.is_valid():
            form = form.save(commit=False)
            form.preSave()
            form.save()
            try:
                new_file = NewFiles.objects.get(id=form.tmdb_id)
                new_file.delete()
                print(f"[NewFile] {form.tmdb_id} successfully deleted!")
            except Exception:
                print("[NewFile] New File does not exist!")

            return redirect("movie_detail", form.id, form.unique_id)
        else:
            print(form.errors)
            try:
                form.poster_file.delete()
            except:
                pass
            return HttpResponseRedirect(request.META.get('HTTP_REFERER'))

    context = {"form": form}
    return render(request, "add/add_movie.html", context)


def addTvShow(request):
    form = TvShowForm()

    if request.method == "POST":
        form = TvShowForm(request.POST)
        if form.is_valid():
            form = form.save(commit=False)
            form.preSave()
            form.save()
            NextDateToCheckEpisodes.objects.update(
                next_date_to_check_episodes=(timezone.now()-timedelta(days=2)))
            try:
                new_file = NewFiles.objects.get(id=form.tvdb_id)
                new_file.delete()
                print(f"[NewFile] {form.tvdb_id} successfully deleted!")
            except Exception:
                print("[NewFile] New File does not exist!")

            return redirect("tv_show_detail", form.id, form.unique_id)
        else:
            errors = form.errors
            print(errors)
            if errors.get("file_path") is not None:
                context = {"form": form}
                render(request, "add/add_tv_show.html", context)
            else:
                form.poster_file.delete()

    context = {"form": form}
    return render(request, "add/add_tv_show.html", context)


def addUnacquiredContent(request):
    form = TvShowForm()
    context = {"form": form}
    return render(request, "add/add_unacquired_content.html", context)


# api #
@ api_view(["GET"])
def apiListContentLengths(request, unacquired: str = "false", type: str = "not-watched", content_type: str = "all",  order: str = "default"):

    length = Lengths.objects.all()

    if unacquired == "false":
        length = length.filter(unacquired=False)
    elif unacquired == "true":
        pass
    else:
        return Response("""Must provide valid unacquired ["true", "false"]""")

    if type == "not-watched":
        length = length.filter(watched=False)
    elif type == "watched":
        length = length.filter(watched=True)
    elif type == "all":
        pass
    else:
        return Response("""Must provide valid type ["not-watched", "watched", "all"]""")

    if content_type == "tv-show":
        length = length.filter(type="Tv-Show")
    elif content_type == "movie":
        length = length.filter(type="Movie")
    elif content_type == "all":
        pass
    else:
        return Response("""Must provide valid content_type ["tv-show", "movie", "all"]""")

    if order == "default":
        length = length.order_by("-length")
    elif order == "reversed":
        length = length.order_by("length")
    else:
        return Response("""Must provide valid order ["default", "reversed"]""")

    serializer = LengthsSerializer(length, many=True)
    return Response(serializer.data)


@ api_view(["POST"])
def apiUpdateFilePath(request, type: str, pk: int) -> bool:
    if type == "show":
        content = get_object_or_404(TvShow, id=pk)
    elif type == "movie":
        content = get_object_or_404(Movie, id=pk)
        return Response("Movie support not implemented yet!")
    else:
        return Response("""Valid types ["show", "movie"]!""")

    # content.file_path = request.data["file_path"]
    # content.save()
    print(request.data)
    return Response({"file_path": content.file_path})


@ api_view(["GET"])
def apiIsLegacy(request, type: str, pk: int) -> bool:
    if type == "show":
        content = get_object_or_404(TvShow, id=pk)
    elif type == "movie":
        content = get_object_or_404(Movie, id=pk)
        return Response("Movie support not implemented yet!")
    else:
        return Response("""Valid types ["show", "movie"]!""")

    check = re.search(r"(?<=\[)[0-9\]]+(?=\])", content.file_path.split("/")[-1])
    if check is None:
        return Response(True)
    return Response(False)


@ api_view(["POST"])
def apiRename(request):
    data = request.data

    print(data)

    try:
        id = data["id"]
        base_path = data["base_path"]
        current_name = data["current_name"]
        new_name = data["new_name"]
        renamed = data["renamed"]
        type = data["type"]
    except:
        return Response("""{"id": 12345, "base_path": "/fake/example", "current_name": "this is a fake show.mkv", "new_name": "this is a modified fake show [12345].mkv", "is_season": true}""")

    is_season = False
    if type == "Season":
        is_season = True

    rename_object = Rename(id, base_path, current_name, new_name, renamed)
    content_type = Path(base_path).parts[-1]

    if is_season == True:
        print("RENAMING SEASON")
        results = rename_object.renameSeason()
    elif content_type == "movies":
        print("RENAMING MOVIE")
        results = rename_object.renameMovie()
    elif content_type == "series":
        print("RENAMING SERIES")
        results = rename_object.renameTvShow()


    if results[1] == "renamed":
        serializer = NewFilesSerializer(results[0], many=False)
        return Response(serializer.data)
    return Response("error")


@ api_view(["GET"])
def apiListNewFiles(request, type: str):
    if type == "movies":
        type = "Movie"
    elif type == "tv-shows":
        type = "Tv-Show"
    elif type == "seasons":
        type = "Season"
    new_files = NewFiles.objects.filter(type=type)
    serializer = NewFilesSerializer(new_files, many=True)
    return Response(serializer.data)


@ api_view(["POST"])
def apiMediainfo(request):
    data = request.data

    try:
        path = data["path"]
    except:
        return Response("""Missing Path! '/plex/series/Rick And Morty/Season 1'""")

    output = subprocess.check_output(["mediainfo-scraper", "-mode", "single", "-format", "json", f"--file={path}"])

    try:
        return Response(json.loads(output))
    except Exception:
        print("[Media Info] File Does Not Exist!")
        return Response("[Media Info] File Does Not Exist!")


@api_view(["GET"])
def apiVerifyId(request, type: str, id: int):
    try:
        if type == "tv-show":
            content = TvShow.objects.get(tvdb_id=id)
        elif type == "movie":
            content = Movie.objects.get(tmdb_id=id)
        else:
            return Response("Invalid type use tv-show or movie")
    except:
        return Response((False))
    return Response((True, content.unacquired, content.id))


@ api_view(["GET"])
def apiOverview(request):
    api_urls = {
        "List Of All Items": "/list-all/",

        "Tv-Show Detail": "/tv-show-detail/<int:pk>",
        "Movie Detail": "/movie-detail/<int:pk>",

        "Create Tv-Show Season": "/create-tv-show-season/<int:tv_show_pk>",

        "Update Tv-Show": "/update-tv-show/<int:pk>",
        "Update Tv-Show Season": "/update-tv-show/<int:tv_show_pk>/<int:tv_show_season_pk>",
        "Update Movie": "/update-movie/<int:pk>",

        "Delete Tv-Show": "/delete-tv-show/<int:pk>",
        "Delete Movie": "/delete-movie/<int:pk>",

        "Create Storage Drive": "/create-drive"
    }
    return Response(api_urls)


@ api_view(["GET", "POST"])
def apiList(request, model: str, page: int = 0):

    requested_model = model
    error_response = Response("No Items Found")

    match model:
        case "unacquired":
            model = QuerySetSequence(TvShow.objects.filter(unacquired=True), Movie.objects.filter(unacquired=True))
            serializer = ListSerializer.listUnacquiredSerializer
        case "tv-shows":
            model = TvShow.objects.filter(unacquired=False)
            serializer = TvShowSerializer
        case "movies":
            model = Movie.objects.filter(unacquired=False)
            serializer = MovieSerializer
        case "all":
            model = QuerySetSequence(TvShow.objects.filter(unacquired=False), Movie.objects.filter(unacquired=False))
            serializer = ListSerializer.listSerializer
        case _:
            return Response("""Invalid Model Type, Valid Types: ["tv-shows", "movies", "all"]""")

    if request.method == "POST" and requested_model != "unacquired":
        data = request.data
        # filtering
        watched = Filtering.exceptionCatcher(data, "watched_filter")
        watched_filter = Q()
        match watched:
            case "all":
                pass
            case "watched":
                watched_filter = Q(watched=True)
            case "not_watched":
                watched_filter = Q(watched=False)

        new_episodes_filter = Q()
        new_episodes_choice = Filtering.exceptionCatcher(data, "new_episodes_filter")
        Filtering.newEpisodesFilter(new_episodes_filter, new_episodes_choice, model)

        rip_type_filter = Q()
        rip_type_choices = Filtering.exceptionCatcher(data, "rip_type_filter")
        Filtering.multipleTypeFilter(rip_type_filter, rip_type_choices, model, "rip_type_filter")

        video_quality_filter = Q()
        video_quality_choices = Filtering.exceptionCatcher(data, "video_quality_filter")
        Filtering.multipleTypeFilter(video_quality_filter, video_quality_choices, model, "video_quality_filter")

        hdr_dv_filter = Q()
        hdr_dv_choices = Filtering.exceptionCatcher(data, "hdr_dv_filter")
        Filtering.multipleTypeFilter(hdr_dv_filter, hdr_dv_choices, model, "hdr_dv_filter")

        dtsx_atmos_filter = Q()
        dtsx_atmos_choices = Filtering.exceptionCatcher(data, "dtsx_atmos_filter")
        Filtering.multipleTypeFilter(dtsx_atmos_filter, dtsx_atmos_choices, model, "dtsx_atmos_filter")

        search_filter = Filtering.exceptionCatcher(request.data, "search_query")
        if search_filter != None and len(search_filter) != 0:
            if str(search_filter).strip() != "":
                split_query = str(search_filter).strip().split()
                grammar_query = ""
                apostrophe_words = {'doesnt': "doesn't",
                                    'cant': "can't",
                                    'wont': "won't",
                                    'dont': "don't",
                                    'ive': "i've",
                                    'youve': "you've",
                                    'hes': "he's",
                                    'shes': "she's",
                                    'its': "it's",
                                    'weve': "we've",
                                    'theyve': "they've",
                                    'im': "i'm",
                                    'youre': "you're",
                                    'were': "we're",
                                    'theyre': "they're"}
                title_words = {'mr': 'mr.', 'mrs': 'mrs.', 'miss': 'miss', 'ms': 'ms.', 'dr': 'dr.', 'prof': 'prof.'}

                for word in split_query:
                    if word in apostrophe_words:
                        grammar_query += f"{apostrophe_words[word]} "
                    else:
                        if word in title_words:
                            grammar_query += f"{title_words[word]} "
                        else:
                            grammar_query += f"{word} "

                if Q(name__icontains=grammar_query.strip()) != Q(name__icontains=str(search_filter).strip()):

                    search_filter = Q(name__icontains=grammar_query.strip()) | Q(
                        name__icontains=str(search_filter).strip())
                else:
                    search_filter = Q(name__icontains=str(search_filter).strip())

                print(search_filter)
        else:
            search_filter = Q()

        all_filters = (watched_filter, new_episodes_filter, rip_type_filter,
                       video_quality_filter, hdr_dv_filter, dtsx_atmos_filter, search_filter)

        filtered = Filtering.combineFilters(all_filters, model)

        if not video_quality_filter.children and len(video_quality_choices) > 0:
            return error_response
        elif not video_quality_filter.children and len(video_quality_choices) > 0:
            return error_response
        elif not hdr_dv_filter.children and len(hdr_dv_choices) > 0:
            return error_response
        elif not dtsx_atmos_filter.children and len(dtsx_atmos_choices) > 0:
            return error_response

    if request.method == "POST" and requested_model == "unacquired":
        search_filter = Filtering.exceptionCatcher(request.data, "search_query")
        if search_filter != None and len(search_filter) != 0:
            if str(search_filter).strip() != "":
                # split_query = str(search_filter).strip().split()
                query_filter = Q()
                # for word in split_query:
                #     query_filter |= Q(name__icontains=word)

                # print(query_filter)
                # filtered = model.filter(query_filter)

                split_query = str(search_filter).strip().split()
                grammar_query = ""
                apostrophe_words = {'doesnt': "doesn't",
                                    'cant': "can't",
                                    'wont': "won't",
                                    'dont': "don't",
                                    'ive': "i've",
                                    'youve': "you've",
                                    'hes': "he's",
                                    'shes': "she's",
                                    'its': "it's",
                                    'weve': "we've",
                                    'theyve': "they've",
                                    'im': "i'm",
                                    'youre': "you're",
                                    'were': "we're",
                                    'theyre': "they're"}
                title_words = {'mr': 'mr.', 'mrs': 'mrs.', 'miss': 'miss', 'ms': 'ms.', 'dr': 'dr.', 'prof': 'prof.'}

                for word in split_query:
                    if word in apostrophe_words:
                        grammar_query += f"{apostrophe_words[word]} "
                    else:
                        if word in title_words:
                            grammar_query += f"{title_words[word]} "
                        else:
                            grammar_query += f"{word} "

                if Q(name__icontains=grammar_query.strip()) != Q(name__icontains=str(search_filter).strip()):

                    search_filter = Q(name__icontains=grammar_query.strip()) | Q(
                        name__icontains=str(search_filter).strip())
                else:
                    search_filter = Q(name__icontains=str(search_filter).strip())

                filtered = model.filter(search_filter)

                print(search_filter)
        else:
            filtered = model

    # sorting
    if request.method == "POST":
        sorting_order = Filtering.exceptionCatcher(request.data, "sorting")
        query = filtered
    else:
        sorting_order = None
        query = model

    match sorting_order:
        case "watched_ascending":
            sorted = Filtering.sortLastWatched(query, "-last_watched_date")

        case "watched_descending":
            sorted = Filtering.sortLastWatched(query, "last_watched_date")

        case "updated_ascending":
            sorted = query.order_by("-updated")

        case "updated_descending":
            sorted = query.order_by("updated")

        case "seasons_ascending":
            if requested_model != "unacquired":
                sorted = Filtering.sortTotalSeasons(query, requested_model, "total_seasons")
            else:
                sorted = query.order_by("-created")

        case "seasons_descending":
            if requested_model != "unacquired":
                sorted = Filtering.sortTotalSeasons(query, requested_model, "-total_seasons")
            else:
                sorted = query.order_by("-created")

        case "size_ascending":
            if requested_model != "unacquired":
                sorted = query.order_by("size")
            else:
                sorted = query.order_by("-created")

        case "size_descending":
            if requested_model != "unacquired":
                sorted = query.order_by("-size")
            else:
                sorted = query.order_by("-created")

        case _:
            sorted = query.order_by("-created")

    if page != 0:
        paginator = Paginator(sorted, 25).get_page(page)
    else:
        paginator = sorted

    try:
        serializer = serializer(paginator, many=True).data
    except TypeError:
        serializer = serializer(paginator)

    if len(serializer) == 0:
        return error_response

    if page != 0:
        all_pages = []
        for page in paginator.paginator.page_range:
            all_pages.append(page)
        return Response({"all_pages": all_pages, "first_page": 1, "last_page": paginator.paginator.num_pages, "data": serializer})
    return Response(serializer)


# api detail #


@ api_view(["GET"])
def apiTvShowDetail(request, pk: int, unique_id: str = None):
    tv_show = get_object_or_404(TvShow, id=pk)

    if tv_show.unacquired == True:
        return Response({"detail": "Not found."})

    if unique_id != tv_show.unique_id:
        return redirect("api_tv_show_detail", pk=pk, unique_id=tv_show.unique_id)

    serializer = TvShowSerializer(tv_show, many=False)
    return Response(serializer.data)


@ api_view(["GET"])
def apiMovieDetail(request, pk: int, unique_id: str = None):
    movie = get_object_or_404(Movie, id=pk)

    if movie.unacquired == True:
        return Response({"detail": "Not found."})

    if unique_id != movie.unique_id:
        return redirect("api_movie_detail", pk=pk, unique_id=movie.unique_id)

    serializer = MovieSerializer(movie, many=False)
    return Response(serializer.data)


@ api_view(["GET"])
def apiUnacquiredDetail(request, type: str, pk: int, unique_id: str = None):
    if type == "movie":
        model = get_object_or_404(Movie, id=pk)
    elif type == "tv-show":
        model = get_object_or_404(TvShow, id=pk)

    if model.unacquired == False:
        return Response({"detail": "Not found."})

    if unique_id != model.unique_id:
        return redirect("api_unacquired_detail", type=type, pk=pk, unique_id=model.unique_id)

    match type:
        case "tv-show":
            serializer = UnacquiredTvShowSerializer(model, many=False)
            return Response(serializer.data)
        case "movie":
            serializer = UnacquiredMovieSerializer(model, many=False)
            return Response(serializer.data)
        case _:
            return Response("""Invalid Type, Valid Types: ["tv-show", "movie"] """)


# aip create #


@ api_view(["POST"])
def apiCreateTvShowSeason(request, pk: int):
    tv_show = get_object_or_404(TvShow, id=pk)

    if tv_show.unacquired == True:
        return Response({"detail": "Not found."})

    tv_show_season_serializer_form = TvShowSeasonSerializerForm(
        data=request.data)
    if tv_show_season_serializer_form.is_valid():
        season_data = tv_show_season_serializer_form.validated_data

        season_exists = TvShowSeason.objects.filter(
            Q(tv_show_id=tv_show.id) & Q(season=season_data["season"]))

        if len(season_exists) != 0:
            return Response(f"Season {season_data['season']} already exists!")

        tv_show_season_serializer_form.save(tv_show_id=tv_show.id)
        tv_show.setTotalSeasons()
        tv_show.setTotalSize()

        tv_show_season = get_object_or_404(
            TvShowSeason, tv_show_id=tv_show.id, season=season_data["season"])
        tv_show_season_serializer = TvShowSeasonSerializer(
            tv_show_season, many=False)

        return Response(tv_show_season_serializer.data)
    else:
        return Response(tv_show_season_serializer_form.errors)


@ api_view(["POST"])
def apiCreateUnacquired(request, type: str):

    match type:
        case "tv-show":
            form = TvShowForm(request.data)
            if form.is_valid():
                form = form.save(commit=False)
                form.unacquired = True
                form.ended = True
                form.file_path = None
                form.preSave()
                form.save()
                unacquired_tv_show = get_object_or_404(TvShow, id=form.id)
                serializer = UnacquiredTvShowSerializer(unacquired_tv_show, many=False)
                return Response(serializer.data)
            else:
                return Response(form.errors)
        case "movie":
            form = UnacquiredMovieForm(request.data)
            if form.is_valid():
                form = form.save(commit=False)
                form.unacquired = True
                form.size = 0
                form.exact_resolution = "3840x2160"
                form.general_resolution = "2160p"
                form.rip_type = "remux"
                form.hdr_dv = "none"
                form.dtsx_atmos = "none"
                form.video = "unacquired"
                form.audio = "unacquired"
                form.file_path = None
                form.preSave()
                form.save()
                unacquired_movie = get_object_or_404(Movie, id=form.id)
                serializer = UnacquiredMovieSerializer(unacquired_movie, many=False)
                return Response(serializer.data)
            else:
                return Response(form.errors)
        case _:
            return Response("""Invalid Type, Valid Types: ["tv-show", "movie"] """)


# api update #


@ api_view(["POST"])
def apiUpdateTvShow(request, pk: int):
    tv_show = get_object_or_404(TvShow, id=pk)
    tv_show_tvdb_id = tv_show.tvdb_id
    form = TvShowForm(instance=tv_show, data=request.data)
    if form.is_valid():
        form = form.save(commit=False)
        if form.tvdb_id != tv_show_tvdb_id:
            form.tmdb_id = None
            form.imdb_id = None
            form.next_poster_check_date = None
        form.preSave()
        form.save()

        NextDateToCheckEpisodes.objects.update(next_date_to_check_episodes=(datetime(2010, 1, 1)))
        new_episodes = NewEpisodes.objects.filter(tv_show_id=tv_show.id)
        new_episodes.delete()

        tv_show = get_object_or_404(TvShow, id=form.id)
        try:
            length = Lengths.objects.get(content_id=tv_show.id, type=tv_show.type)
            length.delete()
        except Lengths.DoesNotExist:
            pass

        serializer = TvShowSerializer(tv_show, many=False)
        return Response(serializer.data)
    else:
        return Response(form.errors)


@ api_view(["POST"])
def apiUpdateTvShowSeason(request, tv_show_pk: int, tv_show_season_pk: int):
    tv_show = get_object_or_404(TvShow, id=tv_show_pk)
    tv_show_season = get_object_or_404(
        TvShowSeason, tv_show_id=tv_show.id, season=tv_show_season_pk)
    serializer_form = TvShowSeasonSerializerForm(
        instance=tv_show_season, data=request.data)

    if serializer_form.is_valid():
        serializer_form.save(season=tv_show_season_pk)
        tv_show.setTotalSeasons()
        tv_show.setTotalSize()

        serializer = TvShowSeasonSerializer(tv_show_season, many=False)
        return Response(serializer.data)
    else:
        return Response(serializer_form.errors)


@ api_view(["POST"])
def apiUpdateMovie(request, pk: int):
    movie = get_object_or_404(Movie, id=pk)
    serializer_form = MovieSerializerForm(instance=movie, data=request.data)

    if serializer_form.is_valid():
        serializer_form = serializer_form.validated_data

        # print(serializer_form)

        fields = ("name", "tmdb_id", "last_watched_date", "size", "exact_resolution",
                  "general_resolution", "rip_type", "hdr_dv", "dtsx_atmos", "video", "audio", "file_path")

        if movie.tmdb_id != serializer_form["tmdb_id"]:
            movie.imdb_id = "0"
            movie.next_poster_check_date = None

        for field in fields:
            try:
                setattr(movie, field, serializer_form[field])
            except KeyError:
                pass

        movie.preSave()
        movie.save()

        try:
            length = Lengths.objects.get(content_id=movie.id, type=movie.type)
            length.delete()
        except Lengths.DoesNotExist:
            pass

        serializer = MovieSerializer(movie, many=False)
        return Response(serializer.data)
    else:
        return Response(serializer_form.errors)


@ api_view(["POST"])
def apiUpdateUnacquired(request, type: str, pk: int):
    match type:
        case "tv-show":
            tv_show = get_object_or_404(TvShow, id=pk)
            if tv_show.unacquired == False:
                return Response({"detail": "Not found."})
            tv_show_tvdb_id = tv_show.tvdb_id
            form = TvShowForm(instance=tv_show, data=request.data)
            if form.is_valid():
                form = form.save(commit=False)
                if form.tvdb_id != tv_show_tvdb_id:
                    form.tmdb_id = None
                    form.imdb_id = None
                    form.next_poster_check_date = None
                form.unacquired = True
                form.ended = True
                form.preSave()
                form.save()
                unacquired_tv_show = get_object_or_404(TvShow, id=form.id)
                serializer = UnacquiredTvShowSerializer(unacquired_tv_show, many=False)
                return Response(serializer.data)
            else:
                return Response(form.errors)

        case "movie":
            movie = get_object_or_404(Movie, id=pk)
            if movie.unacquired == False:
                return Response({"detail": "Not found."})
            movie_tmdb_id = movie.tmdb_id
            form = UnacquiredMovieForm(instance=movie, data=request.data)
            if form.is_valid():
                form = form.save(commit=False)
                if form.tmdb_id != movie_tmdb_id:
                    form.imdb_id = "0"
                    form.next_poster_check_date = None
                form.unacquired = True
                form.size = 0
                form.exact_resolution = "3840x2160"
                form.general_resolution = "2160p"
                form.rip_type = "remux"
                form.hdr_dv = "none"
                form.dtsx_atmos = "none"
                form.video = "unacquired"
                form.audio = "unacquired"
                form.preSave()
                form.save()
                unacquired_movie = get_object_or_404(Movie, id=form.id)
                serializer = UnacquiredMovieSerializer(unacquired_movie, many=False)
                return Response(serializer.data)
            else:
                return Response(form.errors)
        case _:
            return Response("""Invalid Type, Valid Types: ["tv-show", "movie"] """)


# api delete #
@api_view(["DELETE"])
def apiDeleteSeason(request, pk: int, season: int) -> Response:
    tv_show = get_object_or_404(TvShow, id=pk)
    tv_show_season = get_object_or_404(TvShowSeason, tv_show_id=tv_show.id, season=season)
    tv_show_season.delete()
    tv_show.setTotalSeasons()
    tv_show.setTotalSize()
    return Response(f"{tv_show.name}, Season {season} - successfully deleted!")


@ api_view(["DELETE"])
def apiDeleteTvShow(request, pk: int) -> Response:
    tv_show = get_object_or_404(TvShow, id=pk)
    tv_show.poster_file.delete()
    tv_show.delete()
    return Response(f"{tv_show.name} - successfully deleted!")


@ api_view(["DELETE"])
def apiDeleteMovie(request, pk: int) -> Response:
    movie = get_object_or_404(Movie, id=pk)
    movie.poster_file.delete()
    movie.delete()
    return Response(f"{movie.name} - successfully deleted!")


@ api_view(["DELETE"])
def apiDeleteUnacquired(request, type: str, pk: int) -> Response:
    match type:
        case "tv-show":
            tv_show = get_object_or_404(TvShow, id=pk)
            tv_show.poster_file.delete()
            tv_show.delete()
            return Response(f"{tv_show.name} - successfully deleted!")
        case "movie":
            movie = get_object_or_404(Movie, id=pk)
            movie.poster_file.delete()
            movie.delete()
            return Response(f"{movie.name} - successfully deleted!")
        case _:
            return Response("""Invalid Type, Valid Types: ["tv-show", "movie"] """)


@ api_view(["POST"])
def apiConvert(request, type: str, pk: int) -> Response:
    print(request.data, type, pk)
    match type:
        case "tv-show":
            tv_show = get_object_or_404(TvShow, id=pk)
            if tv_show.unacquired == True:
                form = TvShowForm(instance=tv_show)
                form = form.save(commit=False)
                tv_show.unacquired = False
                tv_show.ended = False
                form.preSave()
                form.save()
                serializer = TvShowSerializer(tv_show, many=False)
                try:
                    new_file = NewFiles.objects.get(id=form.tvdb_id)
                    new_file.delete()
                    print(f"[NewFile] {form.tvdb_id} successfully deleted!")
                except Exception:
                    print("[NewFile] New File does not exist!")
            else:
                tv_show.unacquired = True
                tv_show.ended = True
                tv_show.size = 0
                tv_show.total_seasons = 0
                tv_show.storage_space = None
                tv_show.save()
                seasons = TvShowSeason.objects.filter(tv_show=tv_show.id)
                if len(seasons) > 0:
                    for season in seasons:
                        season.delete()
                try:
                    length = Lengths.objects.get(content_id=tv_show.id, type=tv_show.type)
                    length.delete()
                except Lengths.DoesNotExist:
                    pass
                serializer = UnacquiredTvShowSerializer(tv_show, many=False)
            return Response(serializer.data)
        case "movie":
            movie = get_object_or_404(Movie, id=pk)
            if movie.unacquired == True:
                form = MovieForm(instance=movie, data=request.data)
                form = form.save(commit=False)
                movie.unacquired = False
                form.preSave()
                form.save()
                serializer = MovieSerializer(movie, many=False)
                try:
                    new_file = NewFiles.objects.get(id=form.tmdb_id)
                    new_file.delete()
                    print(f"[NewFile] {form.tmdb_id} successfully deleted!")
                except Exception:
                    print("[NewFile] New File does not exist!")
            else:
                movie.unacquired = True
                movie.size = 0
                movie.exact_resolution = "3840x2160"
                movie.general_resolution = "2160p"
                movie.rip_type = "remux"
                movie.hdr_dv = "none"
                movie.dtsx_atmos = "none"
                movie.video = "unacquired"
                movie.audio = "unacquired"
                movie.storage_space = None
                movie.file_path = None
                movie.save()
                try:
                    length = Lengths.objects.get(content_id=movie.id, type=movie.type)
                    length.delete()
                except Lengths.DoesNotExist:
                    pass
                serializer = UnacquiredMovieSerializer(movie, many=False)
            return Response(serializer.data)
        case _:
            return Response("""Invalid Type, Valid Types: ["tv-show", "movie"] """)


@ api_view(["POST"])
def apiAddDrive(request):
    serializer_form = StorageSpaceSerializerForm(data=request.data)

    if serializer_form.is_valid():
        drive_name = serializer_form.validated_data["drive_name"]
        serializer_form.save()

        drive = get_object_or_404(StorageSpace, drive_name=drive_name)
        Storage_space_serializer = StorageSpaceSerializer(drive, many=False)

        return Response(Storage_space_serializer.data)
    else:
        return Response(serializer_form.errors)


@ api_view(["DELETE"])
def apiDeleteDrive(request, pk: int) -> Response:
    drive = get_object_or_404(StorageSpace, id=pk)
    drive.delete()
    return Response(f"{drive.drive_name} - successfully deleted!")
