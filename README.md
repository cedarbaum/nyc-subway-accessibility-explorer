# NYC Subway Accessibility Explorer

This project is a map-based web application for visualizing accessibility data for the NYC subway. It include the followig information currently:

- Subway stations
  - Accessibility status (fully accessible, partially accessible, or inaccessible)
  - Station complex ridership for last full month
  - Eleavtor and Escalators, including uptime stats for the last 6 months
  - Any recent ADA projects associated with the station (either completet or in-progress)
- Subway lines
  - Percent of stations that are accessible for a given line (e.g., A,C,E or 1,2,3)
- Neighborhood data
  - Populaiton statistics from the 2020 Census, including number of residents over 65
  - An accessibility score, which is calculated by considering the percentage of nearest stations that are accessbible
- ADA projects
  - Current and ongoing ADA projects

## Datasets

### [MTA Subway Stations](https://data.ny.gov/Transportation/MTA-Subway-Stations/39hk-dx4f/about_data)

Contains information about NYC Subway stations, including their accessibility.

### [MTA NYCT Subway Elevator and Escalator Availability](https://data.ny.gov/Transportation/MTA-NYCT-Subway-Elevator-and-Escalator-Availabilit/rc78-7x78/about_data)

Contains Elevator/Escalator uptime data.

### [MTA Subway Entrances and Exits](https://data.ny.gov/Transportation/MTA-Subway-Entrances-and-Exits-2024/i9wp-a4ja/about_data)

Contains location of Subway entrances/exits, as well as their type (e.g., stairs, escalator, elevator).

### [MTA Subway Turnstile Usage Data](https://data.ny.gov/Transportation/MTA-Subway-Hourly-Ridership-Beginning-July-2020/wujg-7c2s/about_data)

This dataset contains hourly turnstile data. It is very large, so it is first preprocessed to only include the last month of full data (currently September, 2024).

### [MTA ADA Projects](https://www.google.com/maps/d/viewer?mid=1KyAOi9J92POQ7c_v-471XlbLvrOmIDQ&femb=1&ll=40.71178088520193%2C-73.99431625&z=11)

This is a custom Google Maps dataset which contains information about recent ADA projects. It can be downloaded as KML data.

### [Subway Lines](https://data.cityofnewyork.us/Transportation/Subway-Lines/3qz8-muuu)

Contains GeoJSON definitions of NYC Subway lines. Note that this is currently missing the SIR, which I add in manually during the ETL process.

### [2020 Census Data](https://www.nyc.gov/site/planning/planning-level/nyc-population/2020-census.page)

This website contains data from the 2020 census, which can be downloaded as CSV.

## Development

This project is built with NextJS and [Mapbox](https://www.mapbox.com/). Mapbox requires an access token for usage. After creating one by following the guide [here](https://docs.mapbox.com/help/getting-started/access-tokens/), update/create a `.env.local` file at the root of the project and add it there:

```
NEXT_PUBLIC_MAPBOX_TOKEN=<access token>
```

Next, install dependencies via NPM:

```bash
npm install
```

Finally, run the development server:

```bash
npm run dev
```

You can now view the website on [http://localhost:3000](http://localhost:3000).

## Downloading datasets and ETL

Source datasets are checked in under the `datasets` directory and processed datasets are checked in under the `gis-data` directory (this is what is actually used by the applicaiton). There is no need to download/process data again unless you want to update it. 

### Updating source datasets

The full manifest of datasets used can be found in `scripts/datasets.ts`. Most datasets can be automatically downloaded, but some are marked as `skipDownload` and require manual retrieval and, in some cases, transformation. For example, the turnstile dataset currently needs to be manually downloaded and processed, since it is very large.

Some datasets from [data.ny.gov](https://data.ny.gov/) also require an App Token for retrieval, since their API requires this for larger datasets. For more information about retreieving an access token, see this [page](https://dev.socrata.com/foundry/data.ny.gov/39hk-dx4f).

Once you created an App Token, add it to your `.env.local` file:

```
NY_OPEN_DATA_APP_TOKEN=<app token>
```

You can then download the datasets by running the below command:

```bash
npm run download-datasets
```

### Dataset ETL

Most source datasets will require some transformation to be usable by the app. For example, some datasets are combined into a single GeoJSON file. To process the downloaded datasets, run:

```bash
npm run build-app-data
```

