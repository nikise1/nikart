# AwayFL AVM2 builtins

`@awayfl/awayfl-player` on npm ships `playerglobal.json` but not the ABC catalogs the runtime fetches at play time (`builtin.abc`, `playerglobal.abcs`, `avmplus.abc`). Those files live in the [awayfl-player GitHub repo](https://github.com/awayfl/awayfl-player/tree/dev/builtins) (Apache-2.0).

`scripts/copy-awayfl.mjs` copies this folder over `public/awayfl/builtins/` after the npm package files.
