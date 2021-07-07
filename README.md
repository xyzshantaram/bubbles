# Bubbles
A simple vanilla-JS background animation for your web site.

### Usage
Include into your site with:
```html
<script src="bubbles.js">
<link rel="stylesheet" href="bubbles.css">
```

It exposes a few simple config options via CSS custom properties set in the :root selector.

```css
:root {
    --particle-color: 'rebeccapurple'; /* The particle color. */
    --particle-count: 200; /* Number of particles. Recommended to set this via media-queries. */
    --particle-radius-min: 5; /* Minimum radius of particles. */
    --particle-radius-max: 10; /* Maximum radius of particles. */
    --bubbles-bg: #303030; /* Set the background color. */
    /* --particles-off: 1 */ /* Settings for reduced animation users. */
}
```

Copyright © 2021 Siddharth Singh, subject to the terms of The MIT License