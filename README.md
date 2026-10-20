# nikart

Portfolio site ([nikart.co.uk](https://www.nikart.co.uk)), in English and Spanish.

`www-root/` is the Next.js app that serves the site. `legacy-2014/` is the 2014 Express app. Thumbnails are `content/img`, served at `/content/img`. The portfolio tree is `content/json/data.json`.

Video, games, banners, websites, and 3D files are not in this repo. They are at [static.nikart.co.uk](https://static.nikart.co.uk): `/video_h264`, `/video_webm`, `/games`, `/banners`, `/websites`, `/3d`.

Next.js, React, TypeScript, Tailwind CSS, GSAP, Zustand, next-intl.

From the repo root:

```bash
npm run www-root      # Next.js dev server
npm run legacy-2014   # 2014 site
```

Install, build, deploy, and content sync are in [`www-root/README.md`](www-root/README.md).
