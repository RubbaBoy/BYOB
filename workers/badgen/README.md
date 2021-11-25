This is the packed source of [badgen](https://github.com/badgen/badgen), the badge-generator powering BYOB. The normal npm package could not be used, as Cloudflare Workers can't use Node libraries. I might just be stupid and overlooking something very basic, if so, let me know!

To rebuild these sources from the latest badgen commit, invoke
```bash
./build_badgen.sh
```

And the packaged files will be updated.
