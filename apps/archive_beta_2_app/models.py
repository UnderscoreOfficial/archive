from django.core.validators import MinLengthValidator
from datetime import datetime, timedelta
from django.contrib import messages
from django.core.files import File
from bs4 import BeautifulSoup
from django.db import models
import tvdb_v4_official
import random
from io import BytesIO
import requests
import re
from django.db.models import Sum
from dotenv import load_dotenv
import os

load_dotenv("/git/archive-beta/.env")


# THIRD PARTY API KEYS
tmdb_api_key = os.environ["TMDB_API_KEY"]
tvdb_api_key = os.environ["TVDB_API_KEY"]
tvdb_pin = os.environ["TVDB_PIN"]


rip_type = (
    ("webrip", "WebRip"),
    ("webdl", "WebDL"),
    ("bluray_encode", "BluRay Encode"),
    ("remux", "Remux"),
)
general_resolution = (
    ("480p", "480p"),
    ("720p", "720p"),
    ("1080i", "1080i"),
    ("1080p", "1080p"),
    ("2160p", "2160p"),
)
hdr_dv = (
    ("none", "None"),
    ("hdr_dv", "HDR-DV"),
    ("hdr", "HDR"),
    ("dv", "DV"),
)
dtsx_atmos = (
    ("none", "None"),
    ("dtsx_dolbyatmos", "DTS:X - DolbyAtmos"),
    ("dtsx", "DTS:X"),
    ("dolbyatmos", "DolbyAtmos"),
)
show_or_movie = (
    ("Movie", "Movie"),
    ("Tv-Show", "Tv-Show")
)
drive_types = (
    ("NVME", "NVME"),
    ("HDD", "HDD"),
    ("SSD", "SSD"),
    ("SAS", "SAS")
)


class Content(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    size = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    exact_resolution = models.CharField(max_length=20)
    general_resolution = models.CharField(
        max_length=20, choices=general_resolution)
    rip_type = models.CharField(max_length=20, choices=rip_type)
    hdr_dv = models.CharField(max_length=20, choices=hdr_dv)
    dtsx_atmos = models.CharField(max_length=20, choices=dtsx_atmos)
    video = models.CharField(validators=[MinLengthValidator(
        5, "Must contain at least 5 characters!")], max_length=1000)
    audio = models.CharField(validators=[MinLengthValidator(
        5, "Must contain at least 5 characters!")], max_length=1000)

    class Meta:
        abstract = True


class GeneralProperties():
    @property
    def getUniqueID(self):
        replace_space = re.sub(r"""[\s]""", "-", self.name.lower())
        filtered_name = re.sub(r"""[^-a-z0-9]""", "", replace_space)
        remove_multi_dash = re.sub(r"""-{2,}""", "-", filtered_name)
        return remove_multi_dash

    @property
    def getWatched(self):
        if self.last_watched_date != None:
            return True
        return False

    @property
    def getStorageSpace(self):
        if self.file_path != None:
            for drive in StorageSpace.objects.all():
                try:
                    file_path_drive = str(self.file_path).split("/")[1]
                except:
                    return
                if drive.drive_path.replace("/", "") == file_path_drive:
                    return StorageSpace.objects.get(id=drive.id)


class TvShowProperties():

    def setTotalSeasons(self):
        self.total_seasons = len(TvShowSeason.objects.filter(tv_show=self.id))
        self.save()

    def setTotalSize(self):
        total_size = TvShowSeason.objects.filter(tv_show=self.id).aggregate(Sum("size"))["size__sum"]
        if total_size == None:
            self.size = 0
        else:
            self.size = total_size
        self.save()

    def getIdsFromTvdbID(self):
        if self.imdb_id != None and self.tmdb_id != None:
            return {"imdb_id": self.imdb_id, "tmdb_id": self.tmdb_id}
        base_url = "https://thetvdb.com/series/"
        tvdb = tvdb_v4_official.TVDB(tvdb_api_key, pin=tvdb_pin)
        for key, value in tvdb.get_series(self.tvdb_id).items():
            if key == "slug":
                url = requests.get(base_url + value).content
                ids = {}
                for link in BeautifulSoup(url, "html.parser").find_all("a"):
                    href = link.get("href")
                    if str(href).startswith("https://www.imdb.com"):
                        ids.update({"imdb_id": str(href).split("/")[-2]})
                    if str(href).startswith("https://www.themoviedb.org"):
                        ids.update({"tmdb_id": int(str(href).split("/")[-1])})
                try:
                    ids["imdb_id"]
                except KeyError:
                    ids.update({"imdb_id": None})
                try:
                    ids["tmdb_id"]
                except KeyError:
                    ids.update({"tmdb_id": None})
                return ids

    def tvdbPosterFile(self):
        if self.next_poster_check_date == None or datetime.now().date() >= self.next_poster_check_date:
            print(f"""Getting New Poster File for "{self.name}".""")
            tvdb = tvdb_v4_official.TVDB(tvdb_api_key, pin=tvdb_pin)
            series = tvdb.get_series(self.tvdb_id)
            for key, value in series.items():
                if key == "image":
                    request = requests.get(value)
                    break
            if self.poster_file != "posters/placeholder.png":
                try:
                    self.poster_file.storage.delete(self.poster_file.name)
                except ValueError:
                    pass
                self.poster_file = None
            if request.status_code == 200:
                bytes = BytesIO()
                bytes.write(request.content)
                file_extension = value.split(".")[-1]
                file_name = f"{self.getUniqueID}-tvdb-poster-{random.randint(100000,999999)}.{file_extension}"
                self.next_poster_check_date = (
                    datetime.now().date() + timedelta(days=8))
                self.poster_file.save(file_name, File(bytes))
        else:
            print(
                f"""It has not been at least 7 days since "{self.name}" poster""")


class MovieProperties():

    def getImdbIDFromTmdbID(self):
        print("trying to get imdb")
        if len(self.imdb_id) <= 1:
            response = requests.get(
                f"https://api.themoviedb.org/3/movie/{self.tmdb_id}?api_key={tmdb_api_key}")
            for key, value in response.json().items():
                if key == "imdb_id":
                    return value
            return None
        else:
            print("already have imdb_id")
            return self.imdb_id

    def tmdbPosterFile(self):
        if self.next_poster_check_date == None or datetime.now().date() >= self.next_poster_check_date:
            print(f"""Getting New Poster File for "{self.name}".""")
            response = requests.get(
                f"https://api.themoviedb.org/3/movie/{self.tmdb_id}?api_key={tmdb_api_key}")
            for key, value in response.json().items():
                if key == "poster_path":
                    request = requests.get(
                        "https://image.tmdb.org/t/p/original"+value)
                    break
            if self.poster_file != "posters/placeholder.png":
                self.poster_file.storage.delete(self.poster_file.name)
                self.poster_file = None
            if request.status_code == 200:
                bytes = BytesIO()
                bytes.write(request.content)
                file_extension = value.split(".")[-1]
                file_name = f"{self.getUniqueID}-tmdb-poster-{random.randint(100000,999999)}.{file_extension}"
                self.next_poster_check_date = (
                    datetime.now().date() + timedelta(days=8))
                self.poster_file.save(
                    file_name, File(bytes))
        else:
            print(
                f"""It has not been at least 7 days since last checked "{self.name}" poster, try again later!""")


class StorageSpace(models.Model):
    drive_name = models.CharField(max_length=200)
    drive_path = models.CharField(max_length=200)
    drive_type = models.CharField(max_length=20, choices=drive_types, default="HDD")
    drive_space = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    hidden = models.BooleanField(default=False)

    def __str__(self) -> str:
        return self.drive_name


class TvShow(models.Model, GeneralProperties, TvShowProperties):
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    type = models.CharField(max_length=20, choices=show_or_movie)
    unique_id = models.SlugField(max_length=250, unique=True)
    name = models.CharField(max_length=200)
    size = models.DecimalField(max_digits=20, decimal_places=2, default=0)

    total_seasons = models.PositiveIntegerField(default=0)
    ended = models.BooleanField(default=False)

    imdb_id = models.CharField(max_length=50, validators=[MinLengthValidator(
        1, "Must contain at least 1 characters!")])
    tmdb_id = models.PositiveIntegerField()
    tvdb_id = models.PositiveIntegerField()

    last_watched_date = models.DateField(null=True, blank=True)
    last_watched_season = models.IntegerField(null=True, blank=True)
    last_watched_episode = models.IntegerField(null=True, blank=True)
    watched = models.BooleanField()

    storage_space = models.ForeignKey(StorageSpace, related_name="storage_space_tv_show",
                                      on_delete=models.SET_DEFAULT, default="", blank=True, null=True)

    next_poster_check_date = models.DateField()
    poster_file = models.ImageField(
        upload_to="posters", default="posters/placeholder.png")
    unacquired = models.BooleanField(default=False)
    file_path = models.CharField(max_length=500, null=True, blank=True, validators=[
                                 MinLengthValidator(1, "Must contain at least 1 characters!")])

    def preSave(self):
        ids = self.getIdsFromTvdbID()

        if ids["imdb_id"] == None:
            print("bad need imdb id")
        if ids["tmdb_id"] == None:
            print("bad need imdb id")

        self.imdb_id = ids["imdb_id"]
        self.tmdb_id = ids["tmdb_id"]
        self.type = "Tv-Show"
        self.unique_id = self.getUniqueID
        self.watched = self.getWatched
        self.storage_space = self.getStorageSpace
        self.tvdbPosterFile()


class TvShowSeason(Content):
    tv_show = models.ForeignKey(
        TvShow, related_name="tv_show", on_delete=models.CASCADE)
    season = models.PositiveIntegerField()


class NextDateToCheckEpisodes(models.Model):
    next_date_to_check_episodes = models.DateTimeField()


class NewEpisodes(models.Model):
    tv_show_id = models.ForeignKey(TvShow, related_name='tv_show_id', on_delete=models.CASCADE)
    season = models.PositiveIntegerField()
    episode = models.PositiveIntegerField()
    aired = models.DateField(null=True, blank=True)


class Movie(Content, GeneralProperties, MovieProperties):
    name = models.CharField(max_length=200)
    type = models.CharField(max_length=20, choices=show_or_movie)
    unique_id = models.SlugField(max_length=250, unique=True)

    tmdb_id = models.PositiveIntegerField()
    imdb_id = models.CharField(max_length=20, validators=[MinLengthValidator(1, "Must contain at least 1 characters!")])
    last_watched_date = models.DateField(null=True, blank=True)
    watched = models.BooleanField()

    next_poster_check_date = models.DateField()
    poster_file = models.ImageField(upload_to="posters", default="posters/placeholder.png")
    unacquired = models.BooleanField(default=False)

    storage_space = models.ForeignKey(StorageSpace, related_name="storage_space_movie",
                                      on_delete=models.SET_DEFAULT, default="", blank=True, null=True)
    file_path = models.CharField(max_length=500, null=True, blank=True, validators=[
                                 MinLengthValidator(1, "Must contain at least 1 characters!")])

    def preSave(self):

        imdb_id = self.getImdbIDFromTmdbID()
        if imdb_id == None:
            print("bad need imdb id")
        print(imdb_id)
        self.imdb_id = imdb_id
        self.type = "Movie"
        self.unique_id = self.getUniqueID
        self.watched = self.getWatched
        self.storage_space = self.getStorageSpace
        self.tmdbPosterFile()


class NewFiles(models.Model):
    base_path = models.CharField(max_length=500, validators=[
                                 MinLengthValidator(1, "Must contain at least 1 characters!")])
    current_name = models.CharField(max_length=500, validators=[
                                    MinLengthValidator(1, "Must contain at least 1 characters!")])
    new_name = models.CharField(max_length=500, validators=[
                                MinLengthValidator(1, "Must contain at least 1 characters!")])
    type = models.CharField(max_length=20, choices=show_or_movie)
    name = models.CharField(max_length=500, validators=[MinLengthValidator(1, "Must contain at least 1 characters!")])
    renamed = models.BooleanField(default=False)


class Lengths(models.Model):
    content_id = models.PositiveIntegerField()
    type = models.CharField(max_length=20, choices=show_or_movie)
    unacquired = models.BooleanField(default=False)
    watched = models.BooleanField()
    name = models.CharField(max_length=500, validators=[MinLengthValidator(1, "Must contain at least 1 characters!")])
    length = models.DecimalField(max_digits=20, decimal_places=2, default=0)  # in hours
