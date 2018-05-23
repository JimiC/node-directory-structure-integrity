# API Examples

## `.create` (ECMAScript 6+, TypeScript)

## Using with `async/await`

> Create a verbosely integrity object of the root directory, using the default `md5` algorithm and `hex` encoding

`ES6+`

```js
const hashes = await Integrity.create('./')

// Do something with the hashes here
// It's advised not to modify them
// as it will certainly lead to integrity check failure
// when you'll try to check against them
```

`TypeScript`

```ts
const hashes: IndexedObject = await Integrity.create('./');

// Do something with the hashes here
// It's advised not to modify them
// as it will certainly lead to integrity check failure
// when you'll try to check against them
```

---

> Create a verbosely integrity object of the root directory, using the `sha1` algorithm and `base64` encoding

`ES6+`

```js
const options = { cryptoOptions: { algorithm: 'sha1', encoding: 'base64' } }
const hashes = await Integrity.create('./', options)

// Do something with the hashes here
// It's advised not to modify them
// as it will certainly lead to integrity check failure
// when you'll try to check against them
```

`TypeScript`

```ts
const options: IntegrityOptions = { cryptoOptions: { algorithm: 'sha1', encoding: 'base64' } };
const hashes: IndexedObject = await Integrity.create('./', options);

// Do something with the hashes here
// It's advised not to modify them
// as it will certainly lead to integrity check failure
// when you'll try to check against them
```

---

> Create a verbosely integrity object of a subdirectory

`ES6+`

```ts
const hashes = await Integrity.create('./sub')

// Do something with the hashes here
// It's advised not to modify them
// as it will certainly lead to integrity check failure
// when you'll try to check against them
```

`TypeScript`

```ts
const hashes: IndexedObject = await Integrity.create('./sub');

// Do something with the hashes here
// It's advised not to modify them
// as it will certainly lead to integrity check failure
// when you'll try to check against them
```

---

> Create a non-verbosely integrity object of a file

`ES6+`

```js
const options = { verbose: false }
const hashes = await Integrity.create('./fileToHash.txt', options)

// Do something with the hashes here
// It's advised not to modify them
// as it will certainly lead to integrity check failure
// when you'll try to check against them
```

`TypeScript`

```ts
const options: IntegrityOptions = { verbose: false };
const hashes: IndexedObject = await Integrity.create('./fileToHash.txt', options);

// Do something with the hashes here
// It's advised not to modify them
// as it will certainly lead to integrity check failure
// when you'll try to check against them
```

---

> Create a verbosely integrity object of a subdirectory file

`ES6+`

```js
const hashes = await Integrity.create('./sub/fileToHash.txt')

// Do something with the hashes here
// It's advised not to modify them
// as it will certainly lead to integrity check failure
// when you'll try to check against them
```

`TypeScript`

```ts
const hashes: IntegrityOptions = await Integrity.create('./sub/fileToHash.txt');

// Do something with the hashes here
// It's advised not to modify them
// as it will certainly lead to integrity check failure
// when you'll try to check against them
```

---

> Create a verbosely integrity object of a directory excluding a file

`ES6+`

```js
const options = { exclude: ['fileToExclude.txt'] }
const hashes = await Integrity.create('./dir', options)

// Do something with the hashes here
// It's advised not to modify them
// as it will certainly lead to integrity check failure
// when you'll try to check against them
```

`TypeScript`

```ts
const options: IntegrityOptions = { exclude: ['fileToExclude.txt'] };
const hashes: IndexedObject = await Integrity.create('./dir', options);

// Do something with the hashes here
// It's advised not to modify them
// as it will certainly lead to integrity check failure
// when you'll try to check against them
```

---

> Create a verbosely integrity object of a directory excluding a subdirectory

`ES6+`

```js
const options = { exclude: ['sub'] }
const hashes = await Integrity.create('./dir', options)

// Do something with the hashes here
// It's advised not to modify them
// as it will certainly lead to integrity check failure
// when you'll try to check against them
```

`TypeScript`

```ts
const options: IntegrityOptions = { exclude: ['sub'] };
const hashes: IndexedObject = await Integrity.create('./dir', options);

// Do something with the hashes here
// It's advised not to modify them
// as it will certainly lead to integrity check failure
// when you'll try to check against them
```

---

## Using with `then/catch`

All above examples can be also used with the `then/catch` coding pattern.

Here is how the first example will look like:

>Create a verbosely integrity object of the root directory, using the default `md5` algorithm and `hex` encoding

`ES6+`

```js
Integrity.create('./')
  .then(hashes => {
    // Do something with the hashes here
    // It's advised not to modify them
    // as it will certainly lead to integrity check failure
    // when you'll try to check against them
  })
  .catch(error => console.error(error))
```

`TypeScript`

```ts
Integrity.create('./')
  .then(hashes => {
    // Do something with the hashes here
    // It's advised not to modify them
    // as it will certainly lead to integrity check failure
    // when you'll try to check against them
  })
  .catch(error => console.error(error));
```
