# Importation

## ES5

**Import as a `Class`**

```js
var Integrity = require('ndsi').Integrity;
```

**Import as a `Namespace`**

```js
var ndsi = require('ndsi');

// and use as
ndsi.Integrity. ...
```

## ES6+, Typescript

**Import as a `Class`**

All examples require to import the `Integrity` class before you will be able to use them.

Additionally `ICryptoOptions`, `IndexedObject` and `IntegrityOptions` are also available types.

```ts
import { Integrity } from 'ndsi';
```

**Import as a `Namespace`**

You can also import it as a namespace.

```ts
import * as ndsi from 'ndsi';
```

In that case, all function calls should be modified to use `ndsi` before the classes or types.

```ts
ndsi.Integrity. ...

ndsi.ICryptoOptions. ...

ndsi.IndexedObject. ...

ndsi.IntegrityOptions. ...
```
