import colorama
from pathlib import Path
from .models import NewFiles
import unicodedata
import subprocess
import re
import os
import shutil
from .models import TvShow


class Rename:
    def __init__(self, id, base_path, current_name, new_name, rename) -> None:
        self.id = id
        self.rename = rename
        self.current_name = str(current_name)
        self.new_name = new_name
        self.base_path = Path(base_path)
        self.path = self.base_path.joinpath(str(current_name))
        self.new_path = self.base_path.joinpath(new_name)

    def renameMovie(self):
        if self.current_name == self.new_name:
            try:
                new_file = NewFiles.objects.get(id=self.id)
                new_file.renamed = True
                new_file.save()
            except NewFiles.DoesNotExist as e:
                return (e, "error")
            return (new_file, "renamed")

        if self.rename == True:
            os.rename(str(self.path), str(self.new_path))
            try:
                new_file = NewFiles.objects.get(id=self.id)
                new_file.current_name = self.new_name
                new_file.renamed = True
                new_file.save()
            except NewFiles.DoesNotExist:
                return (None, "error")
            return (new_file, "renamed")

        if "unicode" in self.current_name:
            normalized = unicodedata.normalize("NFKD", self.current_name)
            ascii_string = normalized.encode("ascii", "ignore").decode("utf-8")
            fixed_path = Path.joinpath(str(self.base_path), ascii_string)
            os.rename(str(self.path), str(fixed_path))
            self.path = fixed_path
            self.current_name = self.path.parts[-1]

            try:
                new_file = NewFiles.objects.get(id=self.id)
                new_file.current_name = self.current_name
                new_file.save()
            except NewFiles.DoesNotExist:
                return (None, "error")

        extension = self.current_name.split(".")[-1]

        command = [
            'filebot',
            '-rename',
            '-r',
            str(self.path),
            '--q',
            f"{self.id}",
            '-non-strict',
            '--db',
            'TheMovieDB',
            '--action',
            'move',
            '--output',
            str(self.base_path),
            '--format',
            "{n} ({y}) - [{id}] {vf}{fn.find(/(?i).*\\bHYBRID\\b.*/) ? '.HYBRID' : (fn.find(/(?i).*\\bDV\\b.*/) && fn.find(/(?i)\.hdr.*/)) ? '.HYBRID' : fn.find(/(?i).*\\bDV\\b.*/) ? '.DV' : fn.find(/(?i)\.hdr.*/) ? '.HDR' : ''}{source ? '.' : ''}{fn.find(/(?i).*\\bREMUX\\b.*/) ? '.REMUX' : source ? '.'+source : ''}"
        ]
        result = subprocess.run(command, capture_output=True, text=True)
        try:
            new_path_match = re.search(r"to \[(.*)\.[a-zA-Z]{3}\]", result.stdout).group(1)
        except Exception:
            if result.stderr:
                return (result.stderr, "error")
            return (result.stdout, "error")

        new_name = Path(f"{new_path_match}.{extension}").parts[-1].strip()
        id = re.sub(r"\D+", "", re.findall(r"\[\d+\]", new_name)[0])
        name = new_name.split(f" - [{id}] ")[0]

        try:
            new_file = NewFiles.objects.get(type="Movie", base_path=self.base_path,
                                            current_name=self.current_name, new_name=self.new_name)
            new_file.delete()
            new_file = NewFiles()
            new_file.id = id
            new_file.type = "Movie"
            new_file.base_path = self.base_path
            new_file.current_name = new_name
            new_file.name = name
            new_file.new_name = new_name
            new_file.renamed = True
            new_file.save()
        except NewFiles.DoesNotExist:
            return (None, "error")

        print(f"{colorama.Fore.LIGHTCYAN_EX + self.current_name} {colorama.Fore.WHITE}-> {colorama.Fore.GREEN + new_name}")
        print(colorama.Fore.LIGHTBLACK_EX + "Type: ", colorama.Fore.WHITE + "Movie")
        print(colorama.Fore.LIGHTBLACK_EX + "ID: ", colorama.Fore.WHITE + id)
        print(colorama.Fore.LIGHTBLACK_EX + "Name: ", colorama.Fore.WHITE + name)
        print(colorama.Fore.LIGHTBLACK_EX + "Path: ", colorama.Fore.WHITE + str(self.base_path))

        try:
            new_file = NewFiles.objects.get(id=self.id)
        except NewFiles.DoesNotExist:
            return (None, "error")
        return (new_file, "renamed")

    def renameTvShow(self):
        if self.current_name == self.new_name:
            try:
                new_file = NewFiles.objects.get(id=self.id)
                new_file.renamed = True
                new_file.save()
                print(colorama.Fore.YELLOW + f"[FileBot] {self.new_name} has same name, not renamed!")
            except NewFiles.DoesNotExist as e:
                return (e, "error")
            return (new_file, "renamed")

        command = [
            'filebot',
            '-rename',
            '-r',
            str(self.path),
            '--q',
            f"{self.id}",
            '--db',
            'TheTVDB',
            '-non-strict',
            '--action',
            'move',
            '--output',
            str(self.base_path),
            '--format',
            "{n} ({y}) - [{id}]/{episode.special ? 'Specials' : 'Season ' + s}/{n.replace(' ', '.')}.{s00e00}.{t.replace(' ', '.')}.[{id}].{vf}{fn.find(/(?i).*\\bHYBRID\\b.*/) ? '.HYBRID' : (fn.find(/(?i).*\\bDV\\b.*/) && fn.find(/(?i)\.hdr.*/)) ? '.HYBRID' : fn.find(/(?i).*\\bDV\\b.*/) ? '.DV' : fn.find(/(?i)\.hdr.*/) ? '.HDR' : ''}{fn.find(/(?i).*\\bREMUX\\b.*/) ? '.REMUX' : source ? '.'+source : ''}"
        ]

        result = subprocess.run(command, capture_output=True, text=True)

        command = [
            "tree",
            str(self.path)
        ]
        tree = subprocess.run(command, capture_output=True, text=True)

        try:
            files_left = int(tree.stdout.split(",")[-1].strip().split(" ")[0])
            if files_left == 0:
                shutil.rmtree(str(self.path))
            else:
                error_message = f"[FileBot] Could not delete directory {self.current_name} contains ({files_left}) file/s!"
                print(colorama.Fore.RED + error_message)
                return (error_message, "error")
        except Exception:
            if result.stderr:
                return (result.stderr, "error")
            return (result.stdout, "error")

        try:
            new_path_match = re.search(r"to \[(.*)\.[a-zA-Z]{3}\]", result.stdout).group(1)
        except Exception:
            if result.stderr:
                return (result.stderr, "error")
            return (result.stdout, "error")

        new_name = Path(new_path_match).parts[-3].strip()
        id = re.sub(r"\D+", "", new_name.split("-")[-1])
        name = new_name.replace(f" - [{id}]", "").strip()

        try:
            new_file = NewFiles.objects.get(type="Tv-Show", base_path=self.base_path,
                                            current_name=self.current_name, new_name=self.new_name)
            new_file.delete()
            new_file = NewFiles()
            new_file.id = id
            new_file.type = "Tv-Show"
            new_file.base_path = self.base_path
            new_file.current_name = new_name
            new_file.name = name
            new_file.new_name = new_name
            new_file.renamed = True
            new_file.save()
        except NewFiles.DoesNotExist:
            return (None, "error")

        print(f"{colorama.Fore.LIGHTCYAN_EX + self.current_name} {colorama.Fore.WHITE}-> {colorama.Fore.GREEN + new_name}")
        print(colorama.Fore.LIGHTBLACK_EX + "Type: ", colorama.Fore.WHITE + "Tv-Show")
        print(colorama.Fore.LIGHTBLACK_EX + "ID: ", colorama.Fore.WHITE + id)
        print(colorama.Fore.LIGHTBLACK_EX + "Name: ", colorama.Fore.WHITE + name)
        print(colorama.Fore.LIGHTBLACK_EX + "Path: ", colorama.Fore.WHITE + str(self.base_path))

        try:
            new_file = NewFiles.objects.get(id=self.id)
        except NewFiles.DoesNotExist:
            return (None, "error")
        return (new_file, "renamed")

    def renameSeason(self):
        renamed = re.search(r"(?<=\[)[0-9\]]+(?=\])", self.path.parts[-1])
        is_full_rename = False

        # would be none if show has never been renamed at all
        if renamed is None:
            new_file_type = "series"
            is_full_rename = True
            command = [
                'filebot',
                '-rename',
                '-r',
                str(self.base_path),
                '--q',
                f"{self.id}",
                '--db',
                'TheTVDB',
                '-non-strict',
                '--action',
                'move',
                '--output',
                str(self.base_path.parent),
                '--format',
                "{n} ({y}) - [{id}]/{episode.special ? 'Specials' : 'Season ' + s}/{n.replace(' ', '.')}.{s00e00}.{t.replace(' ', '.')}.[{id}].{vf}{fn.find(/(?i).*\\bHYBRID\\b.*/) ? '.HYBRID' : (fn.find(/(?i).*\\bDV\\b.*/) && fn.find(/(?i)\.hdr.*/)) ? '.HYBRID' : fn.find(/(?i).*\\bDV\\b.*/) ? '.DV' : fn.find(/(?i)\.hdr.*/) ? '.HDR' : ''}{fn.find(/(?i).*\\bREMUX\\b.*/) ? '.REMUX' : source ? '.'+source : ''}"
            ]

            result = subprocess.run(command, capture_output=True, text=True)

            command = [
                "tree",
                str(self.base_path)
            ]

        else:
            new_file_type = "Season"
            command = [
                'filebot',
                '-rename',
                '-r',
                str(f"{self.path}/Season {self.current_name}"),
                '--q',
                f"{self.id}",
                '--db',
                'TheTVDB',
                '-non-strict',
                '--action',
                'move',
                '--output',
                str(self.base_path),
                '--format',
                "{n} ({y}) - [{id}]/{episode.special ? 'Specials' : 'Season ' + s}/{n.replace(' ', '.')}.{s00e00}.{t.replace(' ', '.')}.[{id}].{vf}{fn.find(/(?i).*\\bHYBRID\\b.*/) ? '.HYBRID' : (fn.find(/(?i).*\\bDV\\b.*/) && fn.find(/(?i)\.hdr.*/)) ? '.HYBRID' : fn.find(/(?i).*\\bDV\\b.*/) ? '.DV' : fn.find(/(?i)\.hdr.*/) ? '.HDR' : ''}{fn.find(/(?i).*\\bREMUX\\b.*/) ? '.REMUX' : source ? '.'+source : ''}"
            ]

            result = subprocess.run(command, capture_output=True, text=True)

        try:
            new_path_match = re.search(r"to \[(.*)\.[a-zA-Z]{3}\]", result.stdout).group(1)
        except Exception as e:
            if result.stderr:
                return (result.stderr, "error", e)
            return (result.stdout, "error", e)

        new_name = Path(new_path_match).parts[-3].strip()
        id = re.sub(r"\D+", "", new_name.split("-")[-1])
        name = new_name.replace(f" - [{id}]", "").strip()

        new_files = NewFiles.objects.filter(type=new_file_type, base_path=self.base_path)
        for file in new_files:
            try:
                file.delete()
            except NewFiles.DoesNotExist:
                return (None, "error")

        if is_full_rename == True:
            try:
                tv_show = TvShow.objects.get(tvdb_id=self.id)
                tv_show.file_path = str(Path(new_path_match).parent.parent)
                tv_show.save()
                print(tv_show)
            except:
                return (None, "error")

        if new_file_type == "Season":
            print(f"{colorama.Fore.LIGHTCYAN_EX + 'New Season'} {colorama.Fore.WHITE}-> {colorama.Fore.GREEN + new_name}")
            print(colorama.Fore.LIGHTBLACK_EX + "Type: ", colorama.Fore.WHITE + "Season")
            print(colorama.Fore.LIGHTBLACK_EX + "Season: ", colorama.Fore.WHITE + str(self.current_name))
        else:
            print(f"{colorama.Fore.LIGHTCYAN_EX + self.current_name} {colorama.Fore.WHITE}-> {colorama.Fore.GREEN + new_name}")
            print(colorama.Fore.LIGHTBLACK_EX + "Type: ", colorama.Fore.WHITE + "Tv-Show")
            print(colorama.Fore.LIGHTBLACK_EX + "ID: ", colorama.Fore.WHITE + id)
            print(colorama.Fore.LIGHTBLACK_EX + "Name: ", colorama.Fore.WHITE + name)
            print(colorama.Fore.LIGHTBLACK_EX + "Path: ", colorama.Fore.WHITE + str(self.base_path))

        return ({"id": id, "new_name": new_name, "name": name, "file_path": str(Path(new_path_match).parent.parent)}, "renamed")
