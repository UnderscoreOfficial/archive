from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer
from pathlib import Path
import unicodedata
import subprocess
import colorama
import sqlite3
import time
import re
import requests
import os


colorama.init(autoreset=True)


def isTransferringFiles(target_path):
    try:
        # Run the lsof command to list open files in the target directory
        lsof_command = ["lsof", "+D", target_path]
        grep_command = ["grep", "^scp"]
        wc_command = ["wc", "-l"]

        # Run lsof command and pipe the output to grep, then pipe that to wc
        with open(os.devnull, 'w') as null_file:
            lsof_process = subprocess.Popen(lsof_command, stdout=subprocess.PIPE, stderr=null_file)
        grep_process = subprocess.Popen(grep_command, stdin=lsof_process.stdout, stdout=subprocess.PIPE)
        wc_process = subprocess.Popen(wc_command, stdin=grep_process.stdout, stdout=subprocess.PIPE)

        # Wait for the processes to finish
        wc_process.wait()

        # Get the output of wc command
        wc_output = wc_process.stdout.read().decode().strip()

        if int(wc_output) == 0:
            return False
        return True

    except Exception as e:
        print("An error occurred:", str(e))
        return False


class FileChangeHandler(FileSystemEventHandler):

    # snake_case needed for watch dog observer
    def on_created(self, event):
        path = Path(str.join("/", str(event.src_path).split("/")[:4]))
        show = path.parts[-1]
        base_path = path.parent

        current_full_path = Path.joinpath(base_path, show)

        connect = sqlite3.connect("db.sqlite3")
        cursor = connect.cursor()

        has_unicode = False

        if path.parts[-2] == "movies":
            extension = show.split(".")[-1]
            cursor.execute(
                "SELECT * FROM archive_beta_2_app_newfiles WHERE base_path = ? AND current_name = ?", (str(base_path), str(show)))
            new_path = cursor.fetchone()

            if new_path is None:
                for c in show:
                    if ord(c) > 127:
                        has_unicode = True
                        break

                command = [
                    'filebot',
                    '-rename',
                    '-r',
                    str(path),
                    '-non-strict',
                    '--db',
                    'TheMovieDB',
                    '--action',
                    'test',
                    '--output',
                    str(path.parent),
                    '--format',
                    "{n} ({y}) - [{id}] {vf}{fn.find(/(?i).*\\bHYBRID\\b.*/) ? '.HYBRID' : (fn.find(/(?i).*\\bDV\\b.*/) && fn.find(/(?i)\.hdr.*/)) ? '.HYBRID' : fn.find(/(?i).*\\bDV\\b.*/) ? '.DV' : fn.find(/(?i)\.hdr.*/) ? '.HDR' : ''}{fn.find(/(?i).*\\bREMUX\\b.*/) ? '.REMUX' : source ? '.'+source : ''}"
                ]
                result = subprocess.run(
                    command, capture_output=True, text=True)

                if result.stderr:
                    if "Failed to identify" in result.stderr:
                        print(colorama.Fore.RED +
                              f"File Cannot be found at {current_full_path}")
                    else:
                        print(result.stderr)

                    message = "none"
                    if has_unicode == True:
                        message = "unicode"
                        print(colorama.Fore.YELLOW +
                              f"Unicode found in {current_full_path}")
                    cursor.execute("INSERT INTO archive_beta_2_app_newfiles (type, base_path, current_name, name, new_name, renamed) VALUES (?, ?, ?, ?, ?, ?)",
                                   ("Movie", str(base_path), str(show), message, "none", False))
                    connect.commit()
                    connect.close()
                    return

                try:
                    new_path_match = re.search(
                        r"to \[(.*)\.[a-zA-Z0-9]{3}\]", result.stdout).group(1)
                except Exception:
                    if "] already exists" in result.stdout:
                        new_path_match = re.search(
                            r"because \[(.*)\.[a-zA-Z0-9]{3}\]", result.stdout).group(1)
                    else:
                        message = "none"
                        if has_unicode == True:
                            message = "unicode"
                            print(colorama.Fore.YELLOW +
                                  f"Unicode found in {current_full_path}")
                        cursor.execute("INSERT INTO archive_beta_2_app_newfiles (type, base_path, current_name, name, new_name, renamed) VALUES (?, ?, ?, ?, ?, ?)",
                                       ("Movie", str(base_path), str(show), message, "none", False))
                        connect.commit()
                        connect.close()
                        return

                new_path = Path(
                    f"{new_path_match}.{extension}").parts[-1].strip()
                id = re.sub(r"\D+", "", re.findall(r"\[\d+\]", new_path)[0])
                name = new_path.split(f" - [{id}] ")[0]

                cursor.execute("INSERT INTO archive_beta_2_app_newfiles (id, type, base_path, current_name, name, new_name, renamed) VALUES (?, ?, ?, ?, ?, ?, ?)",
                               (id, "Movie", str(base_path), str(show), name, str(new_path), False))
                connect.commit()

                print(
                    f"{colorama.Fore.LIGHTCYAN_EX + show} {colorama.Fore.WHITE}-> {colorama.Fore.GREEN + new_path}")
                print(colorama.Fore.LIGHTBLACK_EX + "Type: ",
                      colorama.Fore.WHITE + "Movie")
                print(colorama.Fore.LIGHTBLACK_EX +
                      "ID: ", colorama.Fore.WHITE + id)
                print(colorama.Fore.LIGHTBLACK_EX +
                      "Name: ", colorama.Fore.WHITE + name)
                print(colorama.Fore.LIGHTBLACK_EX + "Path: ",
                      colorama.Fore.WHITE + str(base_path))
        elif path.parts[-2] == "series":
            cursor.execute(
                "SELECT * FROM archive_beta_2_app_newfiles WHERE base_path = ? AND current_name = ?", (str(base_path), str(show)))
            new_show = cursor.fetchone()

            if new_show is None:

                # check seasons
                connect = sqlite3.connect("db.sqlite3")
                cursor = connect.cursor()
                cursor.execute(
                    "SELECT id, tvdb_id FROM archive_beta_2_app_tvshow WHERE unacquired = 0 AND file_path = ?", (str(path),))
                db_show = cursor.fetchone()
                if (db_show is not None):
                    cursor.execute(
                        "SELECT season FROM archive_beta_2_app_tvshowseason WHERE tv_show_id = ?", (db_show[0],))
                    db_seasons = cursor.fetchall()

                    for season in path.iterdir():
                        try:
                            season = int(
                                season.parts[-1].replace("Season", "").strip())
                        except:
                            continue
                        valid = False
                        for db_season in db_seasons:
                            db_season = int(db_season[0])
                            if season == db_season:
                                valid = True
                        if valid == False:
                            while (True):
                                if isTransferringFiles(str(path)) == False:
                                    break
                                time.sleep(2)

                            if isTransferringFiles(str(path)) == False:
                                cursor.execute("SELECT * FROM archive_beta_2_app_newfiles WHERE base_path = ? AND current_name = ?", (str(path), season))
                                new_season_added = cursor.fetchone()

                                if new_season_added == None:
                                    id = re.sub(r"\D+", "", path.parts[-1].strip().split("-")[-1])

                                    cursor.execute("INSERT INTO archive_beta_2_app_newfiles (id, type, base_path, current_name, name, new_name, renamed) VALUES (?, ?, ?, ?, ?, ?, ?)",
                                                   (id, "Season", str(path), season, str(show), "none", False))
                                    connect.commit()
                                    print(f"{colorama.Fore.LIGHTCYAN_EX + 'New Season'} {colorama.Fore.WHITE}-> {colorama.Fore.GREEN + path.parts[-1].strip()}")
                                    print(colorama.Fore.LIGHTBLACK_EX + "Path: ", colorama.Fore.WHITE + str(base_path))
                                    print(colorama.Fore.LIGHTBLACK_EX + "Type: ", colorama.Fore.WHITE + "Season")
                                    print(colorama.Fore.LIGHTBLACK_EX + "Season: ", colorama.Fore.WHITE + str(season))

                                    cursor.execute(
                                        "SELECT id, tvdb_id FROM archive_beta_2_app_tvshow WHERE file_path = ?", (str(path),))
                                    tv_show = cursor.fetchone()

                                    # looks like this is the problem
                                    response = requests.post(url="http://192.168.1.117:8000/api/rename",
                                                             json={
                                                                 "id": tv_show[1],
                                                                 "base_path": str(path),
                                                                 "current_name": season,
                                                                 "new_name": "none",
                                                                 "renamed": False,
                                                                 "type": "Season"
                                                             })
                                    response = response.json()

                                    if (response == "renamed"):
                                        print(f"{colorama.Fore.LIGHTCYAN_EX + 'Renamed'} {colorama.Fore.WHITE}-> {colorama.Fore.GREEN + path.parts[-1].strip()}")
                                    else:
                                        print(f"{colorama.Fore.RED + 'Rename error'} {colorama.Fore.WHITE}-> {colorama.Fore.GREEN + path.parts[-1].strip()}")

                cursor.execute(
                    "SELECT * FROM archive_beta_2_app_newfiles WHERE base_path = ? AND name = ?", (f"{base_path}/{show}", str(show)))
                new_season = cursor.fetchone()

                # if path.parts is 4 then it is a season
                if new_season is None and len(path.parts) != 4:
                    try:
                        query = re.search(r"^(.*?) \(\d{4}\)", show).group(1)
                    except Exception:
                        query = re.sub(r"[^a-zA-Z0-9\s]", "", show)
                    command = [
                        'filebot',
                        '-rename',
                        '-r',
                        str(path),
                        '--q',
                        query,
                        '--db',
                        'TheTVDB',
                        '-non-strict',
                        '--action',
                        'test',
                        '--output',
                        str(path.parent),
                        '--format',
                        "{n} ({y}) - [{id}]/{episode.special ? 'Specials' : 'Season ' + s}/{n} - {s00e00} - {t}.{vf}{fn.find(/(?i).*\\bHYBRID\\b.*/) ? '.HYBRID' : (fn.find(/(?i).*\\bDV\\b.*/) && fn.find(/(?i)\.hdr.*/)) ? '.HYBRID' : fn.find(/(?i).*\\bDV\\b.*/) ? '.DV' : fn.find(/(?i)\.hdr.*/) ? '.HDR' : ''}{fn.find(/(?i).*\\bREMUX\\b.*/) ? '.REMUX' : source ? '.'+source : ''}"
                    ]

                    result = subprocess.run(
                        command, capture_output=True, text=True)
                    if result.stderr:
                        message = "none"
                        if has_unicode == True:
                            message = "unicode"
                        if "No media files" in result.stderr:
                            print(colorama.Fore.YELLOW +
                                  f"No files in {current_full_path}")
                        elif "Failed to fetch" in result.stderr:
                            print(colorama.Fore.YELLOW +
                                  f"Failed to fetch data in {current_full_path}")
                        else:
                            print(result.stderr)
                        cursor.execute("INSERT INTO archive_beta_2_app_newfiles (type, base_path, current_name, name, new_name, renamed) VALUES (?, ?, ?, ?, ?, ?)",
                                       ("Tv-Show", str(base_path), str(show), message, "none", False))
                        connect.commit()
                        connect.close()
                        return

                    try:
                        new_path_match = re.search(
                            r"to \[(.*)\.[a-zA-Z0-9]{3}\]", result.stdout).group(1)
                    except Exception:
                        cursor.execute("INSERT INTO archive_beta_2_app_newfiles (type, base_path, current_name, name, new_name, renamed) VALUES (?, ?, ?, ?, ?, ?)",
                                       ("Tv-Show", str(base_path), str(show), "none", "none", False))
                        connect.commit()
                        connect.close()
                        return

                    new_path = Path(new_path_match).parts[-3].strip()
                    id = re.sub(r"\D+", "", new_path.split("-")[-1])
                    name = new_path.replace(f" - [{id}]", "").strip()

                    cursor.execute(
                        "SELECT * FROM archive_beta_2_app_newfiles WHERE id = ?", (id,))
                    find_show = cursor.fetchone()
                    if find_show is not None:
                        print(
                            colorama.Fore.YELLOW + f"Tv-Show with id [{id}] already exists at {current_full_path}")
                        connect.close()
                        return

                    cursor.execute("INSERT INTO archive_beta_2_app_newfiles (id, type, base_path, current_name, name, new_name, renamed) VALUES (?, ?, ?, ?, ?, ?, ?)",
                                   (id, "Tv-Show", str(base_path), str(show), name, str(new_path), False))
                    connect.commit()

                    print(
                        f"{colorama.Fore.LIGHTCYAN_EX + show} {colorama.Fore.WHITE}-> {colorama.Fore.GREEN + new_path}")
                    print(colorama.Fore.LIGHTBLACK_EX + "Type: ",
                          colorama.Fore.WHITE + "Tv-Show")
                    print(colorama.Fore.LIGHTBLACK_EX +
                          "ID: ", colorama.Fore.WHITE + id)
                    print(colorama.Fore.LIGHTBLACK_EX +
                          "Name: ", colorama.Fore.WHITE + name)
            else:
                try:
                    for season in path:
                        print(season)
                except:
                    pass
        connect.close()

    # snake_case needed for watch dog observer
    def on_deleted(self, event):
        path = Path(str.join("/", str(event.src_path).split("/")[:4]))
        show = path.parts[-1]
        base_path = path.parent

        connect = sqlite3.connect("db.sqlite3")
        cursor = connect.cursor()

        if "Season" in str(event.src_path).split("/")[-1]:
            season = str(event.src_path).split("/")[-1]
            cursor.execute("SELECT * FROM archive_beta_2_app_newfiles WHERE base_path = ? AND current_name = ? AND type = ?",
                           (str(path), season.replace("Season ", "").strip(), "Season"))
            path_exists = cursor.fetchone()

            if path_exists is not None:
                print(f"- {show} - " + colorama.Fore.RED + f"({season})")
                cursor.execute("DELETE FROM archive_beta_2_app_newfiles WHERE base_path = ? AND current_name = ? AND type = ?",
                               (str(path), season.replace("Season ", "").strip(), "Season"))
                connect.commit()
        else:
            cursor.execute("SELECT * FROM archive_beta_2_app_newfiles WHERE base_path = ? AND current_name = ?",
                           (str(base_path), str(show)))
            path_exists = cursor.fetchone()
            if path_exists is not None:
                if path.parts[-2] == "movies" or path.parts[-2] == "series":
                    print(f"- {colorama.Fore.RED + str(path) }")
                    cursor.execute(
                        "DELETE FROM archive_beta_2_app_newfiles WHERE base_path = ? AND current_name = ?", (str(base_path), str(show)))
                    connect.commit()
        connect.close()


def onLoad(directories_to_watch):
    connect = sqlite3.connect("db.sqlite3")
    cursor = connect.cursor()
    cursor.execute("DELETE FROM archive_beta_2_app_newfiles")
    connect.commit()
    cursor.execute("""
            SELECT file_path, type FROM archive_beta_2_app_tvshow WHERE unacquired = 0
            UNION ALL
            SELECT file_path, type FROM archive_beta_2_app_movie WHERE unacquired = 0
            """)
    rows = cursor.fetchall()

    full_directories = []
    for i in directories_to_watch:
        full_directories.append(i + "/movies")
        full_directories.append(i + "/series")

    for directory in full_directories:
        Path(directory).joinpath()
        for path in Path(directory).iterdir():
            found = False
            for item in rows:
                if item[0] == str(path):
                    found = True
                    break

            show = path.parts[-1]
            base_path = path.parent

            current_full_path = Path.joinpath(base_path, show)
            if path.parts[-2] == "movies":
                if found == True:
                    continue
                extension = show.split(".")[-1]
                cursor.execute(
                    "SELECT * FROM archive_beta_2_app_newfiles WHERE base_path = ? AND current_name = ?", (str(base_path), str(show)))
                new_path = cursor.fetchone()

                if new_path is None:
                    has_unicode = False
                    for c in show:
                        if ord(c) > 127:
                            has_unicode = True
                            break

                    command = [
                        'filebot',
                        '-rename',
                        '-r',
                        str(path),
                        '-non-strict',
                        '--db',
                        'TheMovieDB',
                        '--action',
                        'test',
                        '--output',
                        str(path.parent),
                        '--format',
                        "{n} ({y}) - [{id}] {vf}{fn.find(/(?i).*\\bHYBRID\\b.*/) ? '.HYBRID' : (fn.find(/(?i).*\\bDV\\b.*/) && fn.find(/(?i)\.hdr.*/)) ? '.HYBRID' : fn.find(/(?i).*\\bDV\\b.*/) ? '.DV' : fn.find(/(?i)\.hdr.*/) ? '.HDR' : ''}{fn.find(/(?i).*\\bREMUX\\b.*/) ? '.REMUX' : source ? '.'+source : ''}"
                    ]
                    result = subprocess.run(
                        command, capture_output=True, text=True)

                    if result.stderr:
                        if "Failed to identify" in result.stderr:
                            print(colorama.Fore.RED +
                                  f"File Cannot be found at {current_full_path}")
                        else:
                            print(result.stderr)

                        message = "none"
                        if has_unicode == True:
                            message = "unicode"
                            print(colorama.Fore.YELLOW +
                                  f"Unicode found in {current_full_path}")
                        cursor.execute("INSERT INTO archive_beta_2_app_newfiles (type, base_path, current_name, name, new_name, renamed) VALUES (?, ?, ?, ?, ?, ?)",
                                       ("Movie", str(base_path), str(show), message, "none", False))
                        connect.commit()
                        connect.close()
                        return

                    try:
                        new_path_match = re.search(
                            r"to \[(.*)\.[a-zA-Z0-9]{3}\]", result.stdout).group(1)
                    except Exception:
                        if "] already exists" in result.stdout:
                            new_path_match = re.search(
                                r"because \[(.*)\.[a-zA-Z0-9]{3}\]", result.stdout).group(1)
                        else:
                            message = "none"
                            if has_unicode == True:
                                message = "unicode"
                                print(colorama.Fore.YELLOW +
                                      f"Unicode found in {current_full_path}")
                            cursor.execute("INSERT INTO archive_beta_2_app_newfiles (type, base_path, current_name, name, new_name, renamed) VALUES (?, ?, ?, ?, ?, ?)",
                                           ("Movie", str(base_path), str(show), message, "none", False))
                            connect.commit()
                            connect.close()
                            return

                    new_path = Path(
                        f"{new_path_match}.{extension}").parts[-1].strip()
                    id = re.sub(
                        r"\D+", "", re.findall(r"\[\d+\]", new_path)[0])
                    name = new_path.split(f" - [{id}] ")[0]

                    cursor.execute("INSERT INTO archive_beta_2_app_newfiles (id, type, base_path, current_name, name, new_name, renamed) VALUES (?, ?, ?, ?, ?, ?, ?)",
                                   (id, "Movie", str(base_path), str(show), name, str(new_path), False))
                    connect.commit()

                    print(
                        f"{colorama.Fore.LIGHTCYAN_EX + show} {colorama.Fore.WHITE}-> {colorama.Fore.GREEN + new_path}")
                    print(colorama.Fore.LIGHTBLACK_EX + "Type: ",
                          colorama.Fore.WHITE + "Movie")
                    print(colorama.Fore.LIGHTBLACK_EX +
                          "ID: ", colorama.Fore.WHITE + id)
                    print(colorama.Fore.LIGHTBLACK_EX +
                          "Name: ", colorama.Fore.WHITE + name)
                    print(colorama.Fore.LIGHTBLACK_EX + "Path: ",
                          colorama.Fore.WHITE + str(base_path))
            elif path.parts[-2] == "series":

                if found == True:
                    # check seasons
                    cursor.execute(
                        "SELECT id, tvdb_id FROM archive_beta_2_app_tvshow WHERE unacquired = 0 AND file_path = ?", (str(path),))
                    db_show = cursor.fetchone()
                    new_seasons = []

                    for season_path in path.iterdir():
                        if "Season" in str(season_path):
                            season_number = int(
                                season_path.parts[-1].replace("Season ", ""))
                            if (db_show is not None):
                                cursor.execute(
                                    "SELECT season FROM archive_beta_2_app_tvshowseason WHERE tv_show_id = ?", (db_show[0],))
                                db_seasons = cursor.fetchall()

                                valid = False
                                for db_season in db_seasons:
                                    db_season = int(db_season[0])
                                    if season_number == db_season:
                                        valid = True
                                if valid == False:
                                    # new_seasons.append(season_number)
                                    # cursor.execute("INSERT INTO archive_beta_2_app_newfiles (type, base_path, current_name, name, new_name, renamed) VALUES (?, ?, ?, ?, ?, ?)",
                                    #                ("Season", str(path), season_number, "none", "none", False))
                                    # connect.commit()
                                    # print(
                                    #     f"{colorama.Fore.LIGHTCYAN_EX + 'New Season'} {colorama.Fore.WHITE}-> {colorama.Fore.GREEN + path.parts[-1].strip()}")
                                    # print(colorama.Fore.LIGHTBLACK_EX +
                                    #       "Type: ", colorama.Fore.WHITE + "Season")
                                    # print(colorama.Fore.LIGHTBLACK_EX + "Season: ",
                                    #       colorama.Fore.WHITE + str(season_number))

                                    cursor.execute("SELECT * FROM archive_beta_2_app_newfiles WHERE base_path = ? AND current_name = ?", (str(path), season_number))
                                    new_season_added = cursor.fetchone()

                                    if new_season_added == None:
                                        id = re.sub(r"\D+", "", path.parts[-1].strip().split("-")[-1])

                                        cursor.execute("INSERT INTO archive_beta_2_app_newfiles (id, type, base_path, current_name, name, new_name, renamed) VALUES (?, ?, ?, ?, ?, ?, ?)",
                                                       (id, "Season", str(path), season_number, str(show), "none", False))
                                        connect.commit()
                                        print(f"{colorama.Fore.LIGHTCYAN_EX + 'New Season'} {colorama.Fore.WHITE}-> {colorama.Fore.GREEN + path.parts[-1].strip()}")
                                        print(colorama.Fore.LIGHTBLACK_EX + "Path: ", colorama.Fore.WHITE + str(base_path))
                                        print(colorama.Fore.LIGHTBLACK_EX + "Type: ", colorama.Fore.WHITE + "Season")
                                        print(colorama.Fore.LIGHTBLACK_EX + "Season: ", colorama.Fore.WHITE + str(season_number))

                                        cursor.execute(
                                            "SELECT id, tvdb_id FROM archive_beta_2_app_tvshow WHERE file_path = ?", (str(path),))
                                        tv_show = cursor.fetchone()

                                        response = requests.post(url="http://192.168.1.117:8000/api/rename",
                                                                 json={
                                                                     "id": tv_show[1],
                                                                     "base_path": str(path),
                                                                     "current_name": season_number,
                                                                     "new_name": "none",
                                                                     "renamed": False,
                                                                     "type": "Season"
                                                                 })
                                        response = response.json()

                                        if (response == "renamed"):
                                            print(f"{colorama.Fore.LIGHTCYAN_EX + 'Renamed'} {colorama.Fore.WHITE}-> {colorama.Fore.GREEN + path.parts[-1].strip()}")
                                        else:
                                            print(f"{colorama.Fore.RED + 'Rename error'} {colorama.Fore.WHITE}-> {colorama.Fore.GREEN + path.parts[-1].strip()}")

                    continue

                cursor.execute(
                    "SELECT * FROM archive_beta_2_app_newfiles WHERE base_path = ? AND current_name = ?", (str(base_path), str(show)))
                new_path = cursor.fetchone()

                if new_path is None:
                    if len(new_seasons) == 0:
                        try:
                            query = re.search(
                                r"^(.*?) \(\d{4}\)", show).group(1)
                        except Exception:
                            query = re.sub(r"[^a-zA-Z0-9\s]", "", show)
                        command = [
                            'filebot',
                            '-rename',
                            '-r',
                            str(path),
                            '--q',
                            query,
                            '--db',
                            'TheTVDB',
                            '-non-strict',
                            '--action',
                            'test',
                            '--output',
                            str(path.parent),
                            '--format',
                            "{n} ({y}) - [{id}]/{episode.special ? 'Specials' : 'Season ' + s}/{n.replace(' ', '.')}.{s00e00}.{t}.[{id}].{vf}{fn.find(/(?i).*\\bHYBRID\\b.*/) ? '.HYBRID' : (fn.find(/(?i).*\\bDV\\b.*/) && fn.find(/(?i)\.hdr.*/)) ? '.HYBRID' : fn.find(/(?i).*\\bDV\\b.*/) ? '.DV' : fn.find(/(?i)\.hdr.*/) ? '.HDR' : ''}{fn.find(/(?i).*\\bREMUX\\b.*/) ? '.REMUX' : source ? '.'+source : ''}"
                        ]

                        result = subprocess.run(
                            command, capture_output=True, text=True)
                        if result.stderr:
                            message = "none"
                            if has_unicode == True:
                                message = "unicode"
                            if "No media files" in result.stderr:
                                print(colorama.Fore.YELLOW +
                                      f"No files in {current_full_path}")
                            elif "Failed to fetch" in result.stderr:
                                print(
                                    colorama.Fore.YELLOW + f"Failed to fetch data in {current_full_path}")
                            else:
                                print(result.stderr)
                            cursor.execute("INSERT INTO archive_beta_2_app_newfiles (type, base_path, current_name, name, new_name, renamed) VALUES (?, ?, ?, ?, ?, ?)",
                                           ("Tv-Show", str(base_path), str(show), message, "none", False))
                            connect.commit()
                            connect.close()
                            return

                        try:
                            new_path_match = re.search(
                                r"to \[(.*)\.[a-zA-Z0-9]{3}\]", result.stdout).group(1)
                        except Exception:
                            cursor.execute("INSERT INTO archive_beta_2_app_newfiles (type, base_path, current_name, name, new_name, renamed) VALUES (?, ?, ?, ?, ?, ?)",
                                           ("Tv-Show", str(base_path), str(show), "none", "none", False))
                            connect.commit()
                            connect.close()
                            return

                        new_path = Path(new_path_match).parts[-3].strip()
                        id = re.sub(r"\D+", "", new_path.split("-")[-1])
                        name = new_path.replace(f" - [{id}]", "").strip()

                        cursor.execute("INSERT INTO archive_beta_2_app_newfiles (id, type, base_path, current_name, name, new_name, renamed) VALUES (?, ?, ?, ?, ?, ?, ?)",
                                       (id, "Tv-Show", str(base_path), str(show), name, str(new_path), False))
                        connect.commit()

                        print(
                            f"{colorama.Fore.LIGHTCYAN_EX + show} {colorama.Fore.WHITE}-> {colorama.Fore.GREEN + new_path}")
                        print(colorama.Fore.LIGHTBLACK_EX + "Type: ",
                              colorama.Fore.WHITE + "Tv-Show")
                        print(colorama.Fore.LIGHTBLACK_EX +
                              "ID: ", colorama.Fore.WHITE + id)
                        print(colorama.Fore.LIGHTBLACK_EX +
                              "Name: ", colorama.Fore.WHITE + name)
    connect.close()


# Specify the directories you want to watch
connect = sqlite3.connect("db.sqlite3")
cursor = connect.cursor()
cursor.execute(f"SELECT drive_path FROM archive_beta_2_app_storagespace")
directories_to_watch = [drives[0] for drives in cursor.fetchall()]

onLoad(directories_to_watch)
print(colorama.Fore.LIGHTYELLOW_EX + "[Startup Finished]")

event_handler = FileChangeHandler()
observer = Observer()

for directory in directories_to_watch:
    observer.schedule(event_handler, directory, recursive=True)

observer.start()

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    observer.stop()

observer.join()
