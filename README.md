This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Deploy on Docker

# Build Image

When changes are made to `/afba/dev.Dockerfile`` run `docker compose -f docker-compose.dev.yml build`

Turns out any config changes need to re-build the image.  E.g. updating Nextjs in `package.json`.

# Run Docker Development Container Locally

Run the image using the command `docker compose -f docker-compose.dev.yml up`

# Production Workflow

Run `docker compose build` to build the production image

Run `docker push denningta/afba:latest` to push production image

On the production server pull the latest image and run:

```
docker compose down
docker compose pull
docker compose up -d
```

# Backup and Restore Docker Volume

[Source] (https://www.augmentedmind.de/2023/08/20/backup-docker-volumes/)

## Backup

On the server define the name of the volume and run the docker command
```
VOLUME="afba_data" &
docker run --rm -v "${VOLUME}:/data" -v "${PWD}:/backup-dir" ubuntu tar cvzf /backup-dir/backup/${VOLUME}.tar.gz /data
```
Creates a temporary docker container, connects to the volume data and uses ubuntu tar to create a compressed .tar.gz of the volume directory.  Saves the file to the current working directory.


## Restore

On the local machine ensure volume is named
```
VOLUME="afba_data"
```

Use `rsync` to copy the file from the remote server

```
rsync -a denningta@192.168.1.240:/home/denningta/afba/backup .
```

Run a docker container to restore the volume data.  (Run with PWD inside the `backup` directory)
```
docker run --rm -v "${VOLUME}:/data" -v "${PWD}:/backup" ubuntu bash -c "rm -rf /data/{*,.*}; cd /data && tar xvzf /backup/${VOLUME}.tar.gz --strip 1"
```

