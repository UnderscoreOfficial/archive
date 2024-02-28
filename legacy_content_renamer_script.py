from pathlib import Path
import subprocess
import shutil
import re
import sqlite3
import colorama
import requests

colorama.init(autoreset=True)


class main:
    def __init__(self) -> None:
        self.drives = ["/plex",
                       "/extraplex",
                       "/moreplex",
                       "/nvmeplex",
                       "/plex_8tb",
                       "/plex_1tb"
                       ]

    def fileBot(self, content):
        command = [
            'filebot',
            '-rename',
            '-r',
            str(content["file_path"]),
            '--q',
            str(content['tvdb_id']),
            '--db',
            'TheTVDB',
            '-non-strict',
            '--action',
            'move',
            '--output',
            str(Path(content["base_path"])),
            '--format',
            "{n} ({y}) - [{id}]/{episode.special ? 'Specials' : 'Season ' + s}/{n.replace(' ', '.')}.{s00e00}.{t.replace(' ', '.')}.[{id}].{vf}{fn.find(/(?i).*\\bHYBRID\\b.*/) ? '.HYBRID' : (fn.find(/(?i).*\\bDV\\b.*/) && fn.find(/(?i)\.hdr.*/)) ? '.HYBRID' : fn.find(/(?i).*\\bDV\\b.*/) ? '.DV' : fn.find(/(?i)\.hdr.*/) ? '.HDR' : ''}{fn.find(/(?i).*\\bREMUX\\b.*/) ? '.REMUX' : source ? '.'+source : ''}"
        ]

        result = subprocess.run(command, capture_output=True, text=True)

        command = [
            "tree",
            content["file_path"]
        ]
        tree = subprocess.run(command, capture_output=True, text=True)

        try:
            files_left = int(tree.stdout.split(",")[-1].strip().split(" ")[0])
            if files_left == 0:
                shutil.rmtree(content["file_path"])
            else:
                error_message = f"[FileBot] Could not delete directory {content['file_path']} contains ({files_left}) file/s!"
                print(colorama.Fore.RED + error_message)
                return (error_message, "error")
        except Exception:
            if result.stderr:
                return (result.stderr, "error")
            return (result.stdout, "error")

        try:
            new_path_match = re.search(
                r"to \[(.*)\.[a-zA-Z]{3}\]", result.stdout).group(1)
        except Exception:
            if result.stderr:
                return (result.stderr, "error")
            return (result.stdout, "error")

        new_name = Path(new_path_match).parts[-3].strip()
        id = re.sub(r"\D+", "", new_name.split("-")[-1])
        name = new_name.replace(f" - [{id}]", "").strip()

        tv_show_data = requests.get(
            f"http://192.168.1.117:8000/api/tv-show-detail/{content['id']}")
        tv_show_data = tv_show_data.json()
        print(tv_show_data, content["id"])

        response = requests.post(
            f"http://192.168.1.117:8000/api/update-tv-show/{content['tvdb_id']}", json={
                "tvdb_id": id,
                "file_path": f"{content['base_path']}/{new_name}",
                "name": new_name,
                "last_watched_date": tv_show_data["last_watched_date"],
                "last_watched_season": tv_show_data["last_watched_season"],
                "last_watched_episode": tv_show_data["last_watched_episode"],
                "watched": tv_show_data["watched"],
                "storage_space": tv_show_data["storage_space"]
            })

        if response.status_code != 200:
            print(response)

        print(
            f"{colorama.Fore.LIGHTCYAN_EX + content['name']} {colorama.Fore.WHITE}-> {colorama.Fore.GREEN + new_name}")
        print(colorama.Fore.LIGHTBLACK_EX + "Type: ",
              colorama.Fore.WHITE + "Tv-Show")
        print(colorama.Fore.LIGHTBLACK_EX + "ID: ", colorama.Fore.WHITE + id)
        print(colorama.Fore.LIGHTBLACK_EX +
              "Name: ", colorama.Fore.WHITE + name)
        print(colorama.Fore.LIGHTBLACK_EX + "Path: ",
              colorama.Fore.WHITE + str(content["base_path"]))

    def rename(self, file_path):
        connect = sqlite3.connect("db.sqlite3")
        cursor = connect.cursor()
        cursor.execute(
            "SELECT id, tvdb_id FROM archive_beta_2_app_tvshow WHERE unacquired = 0 AND file_path = ?", (str(file_path),))
        tv_show = cursor.fetchone()

        main().fileBot({
            "id": tv_show[0],
            "tvdb_id": tv_show[1],
            "file_path": str(file_path),
            "base_path": f"/{Path(file_path).parts[-3]}/{Path(file_path).parts[-2]}",
            "name": str(Path(file_path).parts[-1]),
        })
        connect.close()

    def getPaths(self):
        for drive in self.drives:
            drive = Path(drive)
            if drive.is_dir():
                for folder in drive.iterdir():
                    if folder.name == "series":
                        for series in folder.iterdir():
                            renamed = re.search(
                                r"(?<=\[)[0-9\]]+(?=\])", str(series))
                            if renamed is None:
                                main().rename(series)
                                print(series)
                    # if folder.name == "movies":
                        # for movie in folder.iterdir():
                            # self.rename(movie)

    def run(self):
        self.getPaths()


main().run()
