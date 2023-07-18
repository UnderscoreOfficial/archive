from django import forms
from pathlib import Path
from django.core.exceptions import ValidationError
from .models import TvShow, TvShowSeason, Movie, StorageSpace, rip_type, general_resolution, hdr_dv, dtsx_atmos


def validate_file_path(value):
    if not Path(value).exists():
        raise ValidationError("File path does not exist.")


class TvShowForm(forms.ModelForm):
    name = forms.CharField(min_length=3, max_length=200)
    tvdb_id = forms.IntegerField(min_value=0)
    last_watched_season = forms.IntegerField(min_value=0, required=False)
    last_watched_episode = forms.IntegerField(min_value=0, required=False)
    file_path = forms.CharField(min_length=1, max_length=500, validators=[validate_file_path], required=False)

    class Meta:
        model = TvShow
        fields = ("name", "tvdb_id", "last_watched_date",
                  "last_watched_season", "last_watched_episode", "file_path")
        widgets = {'last_watched_date': forms.DateInput(
            attrs={'type': 'date'})}


class TvShowSeasonForm(forms.ModelForm):
    season = forms.IntegerField(min_value=0)
    size = forms.DecimalField(min_value=0, max_digits=20, decimal_places=2)
    exact_resolution = forms.CharField(min_length=5, max_length=20)
    general_resolution = forms.ChoiceField(
        initial="1080p", choices=general_resolution)
    rip_type = forms.ChoiceField(initial="webdl", choices=rip_type)
    hdr_dv = forms.ChoiceField(initial="none", choices=hdr_dv)
    dtsx_atmos = forms.ChoiceField(initial="none", choices=dtsx_atmos)
    video = forms.CharField(min_length=5, max_length=1000)
    audio = forms.CharField(min_length=5, max_length=1000)

    class Meta:
        model = TvShowSeason
        fields = ("season", "size", "exact_resolution", "general_resolution",
                  "rip_type", "hdr_dv", "dtsx_atmos", "video", "audio")


class MovieForm(forms.ModelForm):
    size = forms.DecimalField(min_value=0, max_digits=20, decimal_places=2)
    exact_resolution = forms.CharField(min_length=5, max_length=20)
    general_resolution = forms.ChoiceField(
        initial="2160p", choices=general_resolution)
    rip_type = forms.ChoiceField(initial="remux", choices=rip_type)
    hdr_dv = forms.ChoiceField(initial="hdr", choices=hdr_dv)
    dtsx_atmos = forms.ChoiceField(initial="dolbyatmos", choices=dtsx_atmos)
    video = forms.CharField(min_length=5, max_length=1000)
    audio = forms.CharField(min_length=5, max_length=1000)
    name = forms.CharField(min_length=3, max_length=200)
    tmdb_id = forms.IntegerField(min_value=0)
    file_path = forms.CharField(min_length=1, max_length=500, validators=[validate_file_path], required=False)

    class Meta:
        model = Movie
        fields = ("name", "tmdb_id", "last_watched_date", "size", "exact_resolution",
                  "general_resolution", "rip_type", "hdr_dv", "dtsx_atmos", "video", "audio", "file_path")
        widgets = {'last_watched_date': forms.DateInput(
            attrs={'type': 'date'})}


class UnacquiredMovieForm(forms.ModelForm):
    name = forms.CharField(min_length=3, max_length=200)
    tmdb_id = forms.IntegerField(min_value=0)

    class Meta:
        model = Movie
        fields = ("name", "tmdb_id", "last_watched_date")
        widgets = {'last_watched_date': forms.DateInput(
            attrs={'type': 'date'})}


class StorageSpaceForm(forms.ModelForm):
    class Meta:
        model = StorageSpace
        fields = ("drive_name", "drive_type", "drive_space", "drive_path")
