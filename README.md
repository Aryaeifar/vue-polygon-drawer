# Vue Polygon Drawer

[![NPM Version](https://img.shields.io/npm/v/vue-polygon-drawer.svg)](https://www.npmjs.com/package/vue-polygon-drawer)
[![NPM Downloads](https://img.shields.io/npm/dm/vue-polygon-drawer.svg)](https://www.npmjs.com/package/vue-polygon-drawer)
[![License](https://img.shields.io/npm/l/vue-polygon-drawer.svg)](https://github.com/Ali-Arya/vue-polygon-drawer/blob/main/LICENSE)

A simple, dependency-free Vue 3 component for drawing, editing, and exporting polygons on an image. Built with the Composition API (`<script setup>`).

---

### Features

-   **Image Upload**: Easily load an image from your local machine.
-   **Polygon Drawing**: Click to create polygon points and right-click to complete a shape.
-   **Edit & Remove**: Name your polygons, edit their names, and remove them individually.
-   **Persistence**: Your image and polygons are automatically saved to `localStorage`, so you can pick up where you left off.
-   **Export**: Export the original image with the final polygons drawn on it as a single PNG file.
-   **Styled & Ready**: Comes with clean, modern styling that can be easily overridden.

---

### Installation

Install the package using your favorite package manager.

```bash
npm install vue-polygon-drawer
```

or

```bash
yarn add vue-polygon-drawer
```

---

### Usage

The component is self-contained. All you need to do is import the component and its stylesheet into your Vue application.

Here is a basic example in a Vue 3 component using `<script setup>`:

```vue
<template>
  <div>
    <h1>My Polygon Editor</h1>
    <PolygonDrawer />
  </div>
</template>

<script setup>
// 1. Import the component
import { PolygonDrawer } from 'vue-polygon-drawer';

// 2. IMPORTANT: Import the stylesheet
import 'vue-polygon-drawer/dist/index.css';
</script>

<style>
/* You can add your own global styles here to customize the container */
body {
  background-color: #f0f2f5;
  padding: 2rem;
}
</style>
```

That's it! The component manages its own state internally.

---

### License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.