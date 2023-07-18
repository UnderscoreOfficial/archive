from .models import NewEpisodes, NextDateToCheckEpisodes, TvShow, TvShowSeason, tvdb_api_key, tvdb_pin
from django.core.exceptions import ObjectDoesNotExist
from datetime import datetime, timedelta
from django.utils import timezone
import tvdb_v4_official
import httpx
import requests
from django.db.models import Q
from asgiref.sync import sync_to_async
from queryset_sequence import QuerySetSequence
import time
import asyncio


class Filtering:

    def newEpisodesFilter(filter, choice, model):

        # getting which episodes are new
        tv_shows_with_new_episodes = []
        for episode in NewEpisodes.objects.all().values("tv_show_id").distinct():
            tv_shows_with_new_episodes.append(episode["tv_show_id"])

        match choice:
            case "all":
                pass

            case "no_new_episodes":
                not_new_episodes = []
                for item in model:
                    if item.id not in tv_shows_with_new_episodes or item.type == "Movie":
                        not_new_episodes.append({"id": item.id, "unique_id": item.unique_id})
                for item in not_new_episodes:
                    filter.add(
                        Q(id=item["id"], unique_id=item["unique_id"]), Q.OR)

            case "new_episodes":
                for id in tv_shows_with_new_episodes:
                    filter.add(Q(id=id, type="Tv-Show"), Q.OR)

    def filterWithEpisodes(filter, model, choice, option):
        for movie in model.filter(type="Movie"):
            movie_option = getattr(movie, option)
            if movie_option == choice:
                filter.add(Q(id=movie.id, unique_id=movie.unique_id), Q.OR)

        tv_show_kwarg = {f"{option}": choice}
        for season in TvShowSeason.objects.filter(**tv_show_kwarg).distinct():
            filter.add(Q(id=season.tv_show.id, unique_id=season.tv_show.unique_id), Q.OR)

    def multipleTypeFilter(filter, choices, model, filter_type):

        rip_type_filter = ["webrip", "webdl", "bluray_encode", "remux"]
        video_quality_filter = ["480p", "720p", "1080i", "1080p", "2160p"]
        hdr_dv_filter = ["hdr_dv", "hdr", "dv"]
        dtsx_atmos_filter = ["dtsx_dolbyatmos", "dtsx", "dolbyatmos"]

        match filter_type:
            case "rip_type_filter":
                valid_choices = rip_type_filter
                option = "rip_type"
            case "video_quality_filter":
                valid_choices = video_quality_filter
                option = "general_resolution"
            case "hdr_dv_filter":
                valid_choices = hdr_dv_filter
                option = "hdr_dv"
            case "dtsx_atmos_filter":
                valid_choices = dtsx_atmos_filter
                option = "dtsx_atmos"

        if choices != None:
            if type(choices) == list:
                for choice in choices:
                    if choice in valid_choices:
                        Filtering.filterWithEpisodes(filter, model, choice, option)
            else:
                Filtering.filterWithEpisodes(filter, model, choices, option)

    def combineFilters(all_filters, model):
        current_filter = None
        for filter in all_filters:
            if current_filter == None:
                current_filter = model.filter(filter)
            else:
                current_filter = current_filter.filter(filter)
        return current_filter

    def sortTotalSeasons(query, requested_model, order):

        match requested_model:
            case "tv-shows":
                sorted = query.order_by(order)
            case "movies":
                sorted = query.order_by("-created")
            case "all":
                tv_shows = query.exclude(**{"#__gt": 0}).order_by(order)
                movies = query.filter(**{"#__gt": 0}).order_by("-created")
                if order == "total_seasons":
                    sorted = QuerySetSequence(movies, tv_shows)
                else:
                    sorted = QuerySetSequence(tv_shows, movies)
        return sorted

    def sortLastWatched(query, order):
        valid_dates = []
        invalid_dates = []
        for item in query:
            if item.last_watched_date != None:
                valid_dates.append(item)
            else:
                invalid_dates.append(item)

        if order == "last_watched_date":
            valid_dates = sorted(valid_dates, key=lambda x: x.last_watched_date)
            return valid_dates + invalid_dates

        valid_dates = sorted(valid_dates, key=lambda x: x.last_watched_date, reverse=True)
        return invalid_dates + valid_dates

    def exceptionCatcher(data_object, filter):
        try:
            filter = data_object[filter]
        except KeyError:
            filter = None
        return filter


class NewEpisodesCheck:
    tvdb = tvdb_v4_official.TVDB(tvdb_api_key, tvdb_pin)

    @ sync_to_async
    def getTvShows(self):
        tv_shows = requests.get("http://192.168.1.117:8000/api/list-tv-shows")
        return tv_shows.json()

    def makeRequestToTVDB(url, client, tv_show) -> dict:
        tvdb_header = {
            "Authorization": f"Bearer {NewEpisodesCheck.tvdb.auth_token}"}
        return {"tv_show": tv_show, "episodes": client.get(url, headers=tvdb_header)}

    async def fetchEpisode(tv_show):
        episodes = await tv_show["episodes"]
        tv_show["episodes"] = episodes.json()

    # gets all the episodes from the tv shows
    async def getAllEpisodesAsRequests(check_time) -> list:
        tv_show_and_episodes_requests = []
        async with httpx.AsyncClient() as client:
            for tv_show in await NewEpisodesCheck.getTvShows():
                if tv_show["ended"] == False or check_time == 1262304000.0 and tv_show["unacquired"] == False:
                    if tv_show["last_watched_season"] and tv_show["last_watched_episode"]:
                        print(tv_show["name"])
                        url = NewEpisodesCheck.tvdb.get_series_episodes(tv_show["tvdb_id"], True)
                        tv_show_and_episodes_requests.append(
                            NewEpisodesCheck.makeRequestToTVDB(url, client, tv_show))
            await asyncio.gather(*[NewEpisodesCheck.fetchEpisode(tv_show) for tv_show in tv_show_and_episodes_requests])
            return tv_show_and_episodes_requests

    @ sync_to_async
    def getNextCheckDate(self):
        try:
            next_date_to_check_episodes = NextDateToCheckEpisodes.objects.get(
                id=1).next_date_to_check_episodes
        except ObjectDoesNotExist:
            next_date_to_check_episodes = datetime(2000, 1, 1)
        return next_date_to_check_episodes.timestamp()

    @ sync_to_async
    def createOrUpdateNextCheckDate(self, method):
        if method == "create":
            NextDateToCheckEpisodes.objects.create(
                next_date_to_check_episodes=(timezone.now()+timedelta(days=2)))
        else:
            NextDateToCheckEpisodes.objects.update(
                next_date_to_check_episodes=(timezone.now()+timedelta(days=2)))

    @ sync_to_async
    def getNewEpisodesFromModel(self):
        new_episodes = NewEpisodes.objects.all()
        episodes = []
        if len(new_episodes) != 0:
            for episode in new_episodes:
                episodes.append(
                    {"episode": episode.episode, "season": episode.season, "tv_show_id": episode.tv_show_id, "aired": episode.aired})
            return episodes
        return None

    @ sync_to_async
    def createNewEpisode(self, tv_show_id, season_number, episode_number, episode_aired_date):
        tv_show = TvShow.objects.get(id=tv_show_id)
        NewEpisodes.objects.create(
            tv_show_id=tv_show,
            season=season_number,
            episode=episode_number,
            aired=episode_aired_date
        )

    @ sync_to_async
    def showEnded(self, tv_show_id):
        tv_show = TvShow.objects.get(id=tv_show_id)
        tv_show.ended = True
        tv_show.save()

    async def checkForNewEpisodes():
        next_date_to_check_episodes = await NewEpisodesCheck.getNextCheckDate()

        # will only check if episodes next check time is >= now or no date exists yet
        if datetime.now().timestamp() >= next_date_to_check_episodes:
            tv_shows = await NewEpisodesCheck.getTvShows()
            if tv_shows == "No Items Found":
                return "No Tv-Shows"

            tv_show_and_episodes = await NewEpisodesCheck.getAllEpisodesAsRequests(next_date_to_check_episodes)

            for tv_show_or_episodes in tv_show_and_episodes:
                tv_show = tv_show_or_episodes["tv_show"]
                episodes = tv_show_or_episodes["episodes"]["data"]["episodes"]
                status = tv_show_or_episodes["episodes"]["data"]["series"]["status"]["name"]
                last_aired_date = datetime.strptime(
                    tv_show_or_episodes["episodes"]["data"]["series"]["lastAired"], "%Y-%m-%d").date()

                check_ended_tv_show = False
                if status == "Ended":
                    if datetime.now().date() <= last_aired_date+timedelta(days=365):
                        check_ended_tv_show = True
                    else:
                        await NewEpisodesCheck.showEnded(tv_show["id"])

                if status == "Continuing" or check_ended_tv_show == True:
                    for episode in episodes:

                        try:
                            episode_aired_date = datetime.strptime(
                                episode["aired"], "%Y-%m-%d").date()
                        except TypeError:
                            continue

                        if episode_aired_date < datetime.now().date():

                            episode_number = episode["number"]
                            season_number = episode["seasonNumber"]

                            if episode_number > tv_show["last_watched_episode"] and season_number == tv_show["last_watched_season"] or season_number > tv_show["last_watched_season"]:

                                stored_new_episode_exists = False
                                new_episodes_model = await NewEpisodesCheck.getNewEpisodesFromModel()

                                if new_episodes_model != None:
                                    for new_episodes in new_episodes_model:
                                        if new_episodes["tv_show_id"].id == tv_show["id"] and new_episodes["season"] == season_number and new_episodes["episode"] == episode_number:
                                            stored_new_episode_exists = True

                                if stored_new_episode_exists == False:
                                    await NewEpisodesCheck.createNewEpisode(tv_show["id"], season_number, episode_number, episode_aired_date)

            if next_date_to_check_episodes == datetime(2000, 1, 1).timestamp():
                await NewEpisodesCheck.createOrUpdateNextCheckDate("create")
            else:
                await NewEpisodesCheck.createOrUpdateNextCheckDate("update")
