# CLI Examples

## `check`

> Check the integrity of the root directory, using a root 'integrity' file

```sh
ndsi check -p ./ -i ./.integrity.json
```

---

## `create`

> Create a verbosely integrity file of the root directory

```sh
ndsi create -p ./
```

---

> Create a verbosely integrity file of a sub directory, and persist it on the subdirectory

```sh
ndsi create -p ./sub -o ./sub
```
