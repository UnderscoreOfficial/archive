from rest_framework import serializers
from .models import TvShow, TvShowSeason, Movie, StorageSpace, NewFiles, Lengths, rip_type, general_resolution, hdr_dv, dtsx_atmos


# tv show #


class TvShowSerializerForm(serializers.ModelSerializer):
    name = serializers.CharField(min_length=3, max_length=200)
    tvdb_id = serializers.IntegerField(min_value=0)
    last_watched_season = serializers.IntegerField(min_value=0, required=False)
    last_watched_episode = serializers.IntegerField(
        min_value=0, required=False)

    class Meta:
        model = TvShow
        fields = ("name", "tvdb_id", "last_watched_date", "last_watched_season",
                  "last_watched_episode", "file_path")


class UnacquiredTvShowSerializer(serializers.ModelSerializer):
    class Meta:
        model = TvShow
        fields = ("id", "created", "updated", "type", "unique_id", "name", "imdb_id", "tmdb_id", "tvdb_id", "last_watched_date",
                  "last_watched_season", "last_watched_episode", "watched", "next_poster_check_date", "poster_file", "unacquired")


class TvShowSerializer(serializers.ModelSerializer):
    class Meta:
        model = TvShow
        fields = "__all__"


# tv show season #


class TvShowSeasonSerializerForm(serializers.ModelSerializer):
    season = serializers.IntegerField(min_value=0)
    size = serializers.DecimalField(
        min_value=0, max_digits=20, decimal_places=2)
    exact_resolution = serializers.CharField(min_length=5, max_length=20)
    general_resolution = serializers.ChoiceField(
        initial="1080p", choices=general_resolution)
    rip_type = serializers.ChoiceField(initial="WebDL", choices=rip_type)
    hdr_dv = serializers.ChoiceField(initial="None", choices=hdr_dv)
    dtsx_atmos = serializers.ChoiceField(initial="None", choices=dtsx_atmos)
    video = serializers.CharField(min_length=5, max_length=1000)
    audio = serializers.CharField(min_length=5, max_length=1000)

    class Meta:
        model = TvShowSeason
        fields = ("season", "size", "exact_resolution", "general_resolution",
                  "rip_type", "hdr_dv", "dtsx_atmos", "video", "audio")


class UnacquiredMovieSerializer(serializers.ModelSerializer):
    class Meta:
        model = TvShow
        fields = ("id", "created", "updated", "type", "unique_id", "name", "imdb_id", "tmdb_id", "last_watched_date",
                  "watched", "next_poster_check_date", "poster_file", "unacquired")


class TvShowSeasonSerializer(serializers.ModelSerializer):
    class Meta:
        model = TvShowSeason
        fields = "__all__"


# movie #


class MovieSerializerForm(serializers.ModelSerializer):
    size = serializers.DecimalField(
        min_value=0, max_digits=20, decimal_places=2)
    exact_resolution = serializers.CharField(min_length=5, max_length=20)
    general_resolution = serializers.ChoiceField(
        initial="2160p", choices=general_resolution)
    rip_type = serializers.ChoiceField(initial="Remux", choices=rip_type)
    hdr_dv = serializers.ChoiceField(initial="HDR", choices=hdr_dv)
    dtsx_atmos = serializers.ChoiceField(
        initial="DolbyAtmos", choices=dtsx_atmos)
    video = serializers.CharField(min_length=5, max_length=1000)
    audio = serializers.CharField(min_length=5, max_length=1000)
    name = serializers.CharField(min_length=3, max_length=200)
    tmdb_id = serializers.IntegerField(min_value=0)

    class Meta:
        model = Movie
        fields = ("name", "tmdb_id", "last_watched_date", "size", "exact_resolution",
                  "general_resolution", "rip_type", "hdr_dv", "dtsx_atmos", "video", "audio", "file_path")


class MovieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Movie
        fields = "__all__"


class ListSerializer:
    def listSerializer(query) -> list:
        response = []
        for data in query:
            if data.type == "Tv-Show":
                data = {"id": data.id,
                        "created": data.created,
                        "updated": data.updated,
                        "type": data.type,
                        "unique_id": data.unique_id,
                        "name": data.name,
                        "total_seasons": data.total_seasons,
                        "ended": data.ended,
                        "imdb_id": data.imdb_id,
                        "tmdb_id": data.tmdb_id,
                        "tvdb_id": data.tvdb_id,
                        "size": data.size,
                        "file_path": data.file_path,
                        "last_watched_date": data.last_watched_date,
                        "last_watched_season": data.last_watched_season,
                        "last_watched_episode": data.last_watched_episode,
                        "watched": data.watched,
                        "next_poster_check_date": data.next_poster_check_date,
                        "poster_file": data.poster_file.url,
                        "unacquired": data.unacquired
                        }

            elif data.type == "Movie":
                data = {"id": data.id,
                        "name": data.name,
                        "type": data.type,
                        "unique_id": data.unique_id,
                        "tmdb_id": data.tmdb_id,
                        "imdb_id": data.imdb_id,
                        "file_path": data.file_path,
                        "last_watched_date": data.last_watched_date,
                        "watched": data.watched,
                        "next_poster_check_date": data.next_poster_check_date,
                        "poster_file": data.poster_file.url,
                        "unacquired": data.unacquired,
                        "created": data.created,
                        "updated": data.updated,
                        "size": data.size,
                        "exact_resolution": data.exact_resolution,
                        "general_resolution": data.general_resolution,
                        "rip_type": data.rip_type,
                        "hdr_dv": data.hdr_dv,
                        "dtsx_atmos": data.dtsx_atmos,
                        "video": data.video,
                        "audio": data.audio,
                        }
            response.append(data)
        return response

    def listUnacquiredSerializer(query) -> list:
        response = []
        for data in query:
            if data.type == "Tv-Show":
                data = {"id": data.id,
                        "created": data.created,
                        "updated": data.updated,
                        "type": data.type,
                        "unique_id": data.unique_id,
                        "name": data.name,
                        "imdb_id": data.imdb_id,
                        "tmdb_id": data.tmdb_id,
                        "tvdb_id": data.tvdb_id,
                        "last_watched_date": data.last_watched_date,
                        "last_watched_season": data.last_watched_season,
                        "last_watched_episode": data.last_watched_episode,
                        "watched": data.watched,
                        "next_poster_check_date": data.next_poster_check_date,
                        "poster_file": data.poster_file.url,
                        "unacquired": data.unacquired
                        }

            elif data.type == "Movie":
                data = {"id": data.id,
                        "name": data.name,
                        "type": data.type,
                        "unique_id": data.unique_id,
                        "tmdb_id": data.tmdb_id,
                        "imdb_id": data.imdb_id,
                        "last_watched_date": data.last_watched_date,
                        "watched": data.watched,
                        "next_poster_check_date": data.next_poster_check_date,
                        "poster_file": data.poster_file.url,
                        "unacquired": data.unacquired,
                        "created": data.created,
                        "updated": data.updated
                        }
            response.append(data)
        return response


class StorageSpaceSerializerForm(serializers.ModelSerializer):
    class Meta:
        model = StorageSpace
        fields = ("drive_name", "drive_type", "drive_space", "drive_path")


class StorageSpaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = StorageSpace
        fields = "__all__"


class NewFilesSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewFiles
        fields = "__all__"


class LengthsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lengths
        fields = "__all__"
