# Bubbles

A simple vanilla-JS background animation for your web site.

### Usage

Include into your site with:

```html
<script src="bubbles.js">
<link rel="stylesheet" href="bubbles.css">
```

It exposes a few simple config options via CSS custom properties set in the
:root selector.

```css
:root {
    --particle-color: 'rebeccapurple'; /* The particle color. */
    --particle-count: 200; /* Number of particles. Recommended to set this via media-queries. */
    --particle-radius-min: 5; /* Minimum radius of particles. */
    --particle-radius-max: 10; /* Maximum radius of particles. */
    --bubbles-bg: #303030; /* Set the background color. */
    --max-alpha: 75; /* a percentage, 0-100 */
    --velocity-constant: 0.3; /* a constant that determines the velocity of bubbles. default is 0.5 */
}

/* Settings for reduced animation users */
@media (prefers-reduced-motion) {
    --particles-off: 1;
}
```

## New/Advanced Configuration Options

Add these variables to your `:root` or any CSS selector to further customize the Bubbles animation:

```css
:root {
    /* SHAPE AND RENDERING */
    --particle-shape: circle;      /* Options: 'circle', 'star', 'star-outline', or 'random' for variety. */
    --particle-movement: random;   /* 'random' (default/classic), or 'radial' to orbit the center. */

    /* LERP AND MOUSE INTERACTION */
    --particle-lerp-factor: 0.2;   /* How quickly particles are repelled from the mouse (smaller = slower/softer). */

    /* STAR SPINNING */
    --particle-spin-min: -0.03;      /* Minimum star rotation speed (radians/frame). */
    --particle-spin-max: 0.03;       /* Maximum star rotation speed (radians/frame). */

    /* RADIAL MOVEMENT */
    --particle-radial-speed: 0.002; /* Base speed for radial orbit (the actual speed also depends on spawn radius and jitter). */

    /* TWINKLE EFFECT */
    --particle-twinkle-style: fade;  /* 'fade' (smooth brightness fade, default) or 'flash' (hard blink). */
}
```

### Shape Reference

- **circle**: Classic bubble.
- **star**: Filled 5-pointed spinning star.
- **star-outline**: Outlined 5-pointed spinning star.
- **random**: Bubble may be any of the above.

### Movement Reference

- **random**: Bubbles drift individually (classic).
- **radial**: Bubbles orbit the center at a fixed radius.

### Twinkle

- All particles smoothly vary in brightness over time.
- Use `--particle-twinkle-style: flash;` for abrupt "Christmas lights" blinking.

Copyright © 2021 Siddharth Singh, subject to the terms of the MIT License
