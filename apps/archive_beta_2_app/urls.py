from django.conf import settings
from django.conf.urls.static import static

from django.urls import path
from . import views

defaultPatterns = [
    path("", views.home, {"tab": "new-episodes"}, name="new_episodes"),
    path("home/<str:tab>", views.home, name="home"),
    path("search", views.search, name="search"),
    path("stats", views.stats, name="stats"),

    path("add-movie", views.addMovie, name="add_movie"),
    path("add-tv-show", views.addTvShow, name="add_tv_show"),
    path("add-unacquired-content", views.addUnacquiredContent, name="add_unacquired_content"),

    path("movie/<int:pk>/", views.movieDetail, name="movie_detail_short"),
    path("movie/<int:pk>/<slug:unique_id>", views.movieDetail, name="movie_detail"),

    path("tv-show/<int:pk>/", views.tvShowDetail, name="tv_show_detail_short"),
    path("tv-show/<int:pk>/<slug:unique_id>", views.tvShowDetail, name="tv_show_detail"),

    path("unacquired-<slug:type>/<int:pk>/", views.unacquiredContentDetail, name="unacquired_content_detail_short"),
    path("unacquired-<slug:type>/<int:pk>/<slug:unique_id>",
         views.unacquiredContentDetail, name="unacquired_content_detail"),
]

api = [
    path("api/", views.apiOverview, name="api"),
    path("api/overview", views.apiOverview, name="api_overview"),

    path("api/list-<slug:model>/", views.apiList, name="api_list"),
    path("api/list-<slug:model>/page=<int:page>", views.apiList, name="api_list_pages"),

    path("api/create-tv-show-season/<int:pk>/", views.apiCreateTvShowSeason, name="api_create_tv_show_season"),
    path("api/create-unacquired-<slug:type>/", views.apiCreateUnacquired, name="api_create_unacquired"),


    path("api/tv-show-detail/<int:pk>/", views.apiTvShowDetail, name="api_tv_show_detail_short"),
    path("api/tv-show-detail/<int:pk>/<slug:unique_id>", views.apiTvShowDetail, name="api_tv_show_detail"),

    path("api/movie-detail/<int:pk>/", views.apiMovieDetail, name="api_movie_detail_short"),
    path("api/movie-detail/<int:pk>/<slug:unique_id>", views.apiMovieDetail, name="api_movie_detail"),

    path("api/unacquired-<slug:type>-detail/<int:pk>/", views.apiUnacquiredDetail, name="api_unacquired_detail_short"),
    path("api/unacquired-<slug:type>-detail/<int:pk>/<slug:unique_id>",
         views.apiUnacquiredDetail, name="api_unacquired_detail"),

    path("api/update-tv-show/<int:pk>/", views.apiUpdateTvShow, name="api_update_tv_show"),
    path("api/update-tv-show/<int:tv_show_pk>/<int:tv_show_season_pk>",
         views.apiUpdateTvShowSeason, name="api_update_tv_show_season"),
    path("api/update-movie/<int:pk>", views.apiUpdateMovie, name="api_update_movie"),
    path("api/update-unacquired-<slug:type>/<int:pk>", views.apiUpdateUnacquired, name="api_update_unacquired"),


    path("api/delete-tv-show/<int:pk>", views.apiDeleteTvShow, name="api_delete_tv_show"),
    path("api/delete-movie/<int:pk>", views.apiDeleteMovie, name="api_delete_movie"),
    path("api/delete-unacquired-<slug:type>/<int:pk>", views.apiDeleteUnacquired, name="api_delete_unacquired"),
    path("api/delete-season/<int:pk>/<int:season>", views.apiDeleteSeason, name="api_delete_season"),

    path("api/convert-<slug:type>/<int:pk>", views.apiConvert, name="api_convert"),

    path("api/add-drive/", views.apiAddDrive, name="api_add_drive"),
    path("api/delete-drive/<int:pk>", views.apiDeleteDrive, name="api_delete_drive"),

    path("api/mediainfo", views.apiMediainfo, name="api_mediainfo"),

    path("api/rename", views.apiRename, name="api_rename"),
    path("api/list-new-files/<slug:type>", views.apiListNewFiles, name="api_list_new_files"),

    path("api/verify-id/<slug:type>/<int:id>", views.apiVerifyId, name="api_verify_id"),

    path("api/list-content-lengths/<slug:unacquired>/<slug:type>/<slug:content_type>/<slug:order>",
         views.apiListContentLengths, name="api_list_content_lengths")
]

urlpatterns = defaultPatterns + api
