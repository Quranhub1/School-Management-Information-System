# Framer Motion UI Standards

SMIS already bundles Framer Motion. Use the existing dependency for restrained, purposeful transitions; do not add another animation package.

## Approved usage

- Workspace/module changes: use AnimatePresence and motion wrappers for short opacity/transform transitions.
- Sidebar accordions: animate height and opacity, keeping collapsed content non-interactive and hidden from assistive technology.
- Dialogs and tab panels: use the same shared motion conventions when their existing component lifecycle supports enter/exit animation.
- Respect the operating system's reduced-motion preference with useReducedMotion; disable or substantially reduce non-essential movement.
- Prefer opacity and small transforms over animating layout-heavy properties. Avoid large blur, filter, box-shadow, and full-screen parallax animations.
- Keep durations short (roughly 150–200 ms) for administrative workflows. Animation must never delay form submission, navigation, validation, or keyboard interaction.

## Performance and accessibility

Browser compositing can make opacity and transform transitions efficient, but Framer Motion does not guarantee GPU acceleration or 60 FPS on every device. Profile representative low-powered hardware before expanding animation use.

- Preserve semantic HTML, focus order, keyboard operation and ARIA state.
- Collapsed accordion content must not remain focusable.
- Do not animate the login iframe, login page, authentication state, or login assets as part of dashboard transitions.
- Avoid animating large tables, AG Grid rows, or thousands of records.
- Keep animations progressive enhancement: functionality must work when reduced motion is enabled or animation is unavailable.
