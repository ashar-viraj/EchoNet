import requests as req
import json
import time
import os
from tqdm import tqdm

# texts, movies, audio, software, image
query_to_search = 'mediatype:(software)'
tuples_per_page = 10000
json_output = os.path.expanduser('./scrape_software_v1.ndjson')
checkpoint_file = os.path.expanduser('./checkpoint_software_v1.json')
user_agent = 'echoNetScraper/1.0'
home_url = 'https://archive.org/services/search/v1/scrape'

Meta_Data = ['identifier','description','language','item_size','downloads','btih','mediatype','subject','title','publicdate']
buffer_time = 0.5
max_tries = 4

def fetch(cursor='*'):
    if cursor == '*':
        params = {
            'q': query_to_search,
            'fields': ','.join(Meta_Data),
            'size': tuples_per_page
        }
    else:
        params = {
            'q': query_to_search,
            'fields': ','.join(Meta_Data),
            'size': tuples_per_page,
            'cursor': cursor
        }
    for tries in range(max_tries):
        try:
            resp = req.get(home_url, params=params, headers={'User-Agent': user_agent}, timeout=60)
            print("Fetching cursor: ", cursor)
            if resp.status_code == 200:
                data = resp.json()
                if 'items' in data:
                    return data
                else:
                    print("Invalid response for cursor: ", cursor, "Retrying...")
            else:
                print("Status: ", resp.status_code, "Retrying...")
        except Exception as e:
            print("Exception on cursor: ", cursor, "Exception: ", e, "Retrying...")
        time.sleep(2 ** tries)
    print("Failed after ", max_tries, " tries for cursor: ", cursor)
    return None


def checkpoint(cursor):
    with open(checkpoint_file, 'w') as c:
        json.dump({'last_cursor': cursor}, c)


def checkpoint_load():
    if os.path.exists(checkpoint_file):
        with open(checkpoint_file, 'r') as c:
            return json.load(c).get('last_cursor', '*')
    return '*'


def main():
    cursor = checkpoint_load()
    total_docs = 0
    print("Starting scrape from cursor: ", cursor)

    with open(json_output, 'a', encoding='utf-8') as json_out:
        pbar = tqdm(total=0)
        while True:
            data = fetch(cursor)
            if not data or 'items' not in data:
                print("No data for cursor: ", cursor, "Stopping.")
                break

            docs = data['items']
            if not docs:
                print("No more items for cursor: ", cursor)
                break

            for d in docs:
                identifier = d.get('identifier')
                if not identifier:
                    continue
                book_data = {
                    'identifier': d.get('title', 'Unknown'),
                    'description': d.get('description', 'Unknown'),
                    'language': d.get('language', 'Unknown'),
                    'item_size': d.get('item_size', 0),
                    'downloads': d.get('downloads', 0),
                    'btih': d.get('btih', 'Unknown'),
                    'mediatype': d.get('mediatype', 'Unknown'),
                    'subject': d.get('subject', 'Unknown'),
                    'title': d.get('title', 'Unknown'),
                    'publicdate': d.get('publicdate', 'Unknown'),
                    'url': f"https://archive.org/details/{identifier}"
                }
                json_out.write(json.dumps(book_data, ensure_ascii=False) + '\n')

            json_out.flush()
            total_docs += len(docs)
            pbar.total = total_docs
            pbar.refresh()

            cursor = data.get('cursor')
            checkpoint(cursor)

            print("Saved: ", len(docs), "items, total: ", total_docs)
            if not cursor:
                print("Reached end of dataset for cursor: ", cursor)
                break

            time.sleep(buffer_time)

    print("Scraping completed. Total documents: ", total_docs, ". Output: ", json_output)


if __name__ == '__main__':
    main()

'''
https://archive.org/advancedsearch.php?q=mediatype%3A%28texts%29&fl%5B%5D=creator&fl%5B%5D=title&sort%5B%5D=&sort%5B%5D=&sort%5B%5D=&rows=50&page=1&output=json&callback=callback&save=yes

https://archive.org/advancedsearch.php?q=mediatype%3A%28texts%29&fl%5B%5D=creator&fl%5B%5D=downloads&fl%5B%5D=identifier&fl%5B%5D=language&fl%5B%5D=title&fl%5B%5D=year&sort%5B%5D=&sort%5B%5D=&sort%5B%5D=&rows=1&page=1&output=json&callback=callback&save=yes

https://archive.org/services/search/v1/scrape?q=mediatype:(texts)&fields=identifier,title,creator,year,language,downloads,avg_rating,backup_location,btih,call_number,collection,contributor,coverage,creator,date,description,downloads,external-identifier,foldoutcount,format,genre,identifier,imagecount,indexflag,item_size,language&count=10000

https://archive.org/services/search/v1/scrape?q=mediatype:(texts)&fields=identifier,licenseurl,mediatype,members,month,name,noindex,num_reviews,oai_updatedate,publicdate,publisher,related-external-id,reviewdate,rights,scanningcenter,source,stripped_tags,subject,title,type,volume,week,year&count=10000

https://archive.org/services/search/v1/scrape?q=mediatype:(texts)&fields=identifier,title,creator,year,language,downloads&count=10000

available response fields:
{
    "identifier": "0-._20211206",
    "description": "دراسات, في الفلكلور, السوداني,  -0 د.نصرالدين, سليمان",
    "title": "دراسات في الفلكلور السوداني 0 د.نصرالدين سليمان",
    "collection": [
        "booksbylanguage_arabic",
        "booksbylanguage",
        "fav-abuamgdad1",
        "fav-abunafy",
        "fav-arabihawari",
        "fav-naffy",
        "fav-nafisa_yasir_elhadi",
        "fav-quentin_kinzy",
        "fav-yasser0749",
        "fav-zeo404"
    ],
    "language": "Arabic",
    "item_size": 67962710,
    "downloads": 548,
    "format": [
        "Additional Text PDF",
        "Archive BitTorrent",
        "DjVuTXT",
        "Djvu XML",
        "Image Container PDF",
        "Item Tile",
        "Metadata",
        "OCR Page Index",
        "OCR Search Text",
        "Page Numbers JSON",
        "Scandata",
        "Single Page Processed JP2 ZIP",
        "chOCR",
        "hOCR"
    ],
    "btih": "6fe217e88e5d465235da2bf9eb7a08574a6abd1c",
    "indexflag": [
        "index",
        "nonoindex"
    ],
    "mediatype": "texts",
    "subject": [
        "دراسات",
        "في الفلكلور",
        "السوداني",
        "-0 د.نصرالدين",
        "سليمان"
    ],
    "title": "دراسات في الفلكلور السوداني 0 د.نصرالدين سليمان",
    "publicdate": "2021-12-06T02:06:08Z",
    "month": 44,
    "week": 13,
    "oai_updatedate": [
        "2021-12-06T02:06:08Z",
        "2025-04-22T23:59:55Z"
    ]
}

required response:
{
    "identifier": "0-._20211206",
    "description": "دراسات, في الفلكلور, السوداني,  -0 د.نصرالدين, سليمان",
    "language": "Arabic",
    "item_size": 67962710,
    "downloads": 548,
    "btih": "6fe217e88e5d465235da2bf9eb7a08574a6abd1c",
    "mediatype": "texts",
    "subject": [
        "دراسات",
        "في الفلكلور",
        "السوداني",
        "-0 د.نصرالدين",
        "سليمان"
    ],
    "title": "دراسات في الفلكلور السوداني 0 د.نصرالدين سليمان",
    "publicdate": "2021-12-06T02:06:08Z",
}
'''