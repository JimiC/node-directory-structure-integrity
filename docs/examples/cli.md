# CLI Examples

## `check`

> Check the integrity of the root directory, using a root 'integrity' file

```sh
ndsi check -s ./ -i ./.integrity.json

```
> Check the integrity of the root directory, using the 'integrity' from a manifest file

```sh
ndsi check -m -s ./
```

---

## `create`

> Create a non-verbosely integrity file of the root directory

```sh
ndsi create -s ./
```

---

> Create a verbosely integrity file of the root directory

```sh
ndsi create -v -s ./
```

---

> Create a non-verbosely integrity file of a sub directory and persist it on the subdirectory

```sh
ndsi create -s ./sub -o ./sub
```
---

> Create a non-verbosely integrity file of the root directory and persist it on the manifest file

```sh
ndsi create -m -s ./
```
