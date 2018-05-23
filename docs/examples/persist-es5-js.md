# API Examples

## `.persist` (ECMAScript 5)

> Persist the integrity object on the current working directory

```js
// Assuming you have previously created an integrity hashes object

// Persist them on disk
Integrity.persist(hashes)
  .then(() => console.log('Integrity file saved'))
  .catch(error => console.error(error))
```

---

> Persist the integrity object on a specific directory (absolute path)

```js
// Assuming you have previously created an integrity hashes object

// Persist them on disk
Integrity.persist(hashes, '/dir/to/persist/the/integrity/object')
  .then(() => console.log('Integrity file saved'))
  .catch(error => console.error(error))
```

---

> Persist the integrity object on a specific directory (relative path)

```js
// Assuming you have previously created an integrity hashes object

// Persist them on disk
Integrity.persist(hashes, './dir/to/persist/the/integrity/object')
  .then(() => console.log('Integrity file saved'))
  .catch(error => console.error(error))
```
