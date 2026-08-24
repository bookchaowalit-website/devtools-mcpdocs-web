---
name: Schema / Log
description: A dark protocol field log for drafting, searching, and retiring local MCP tool records.
---

# Design System: Schema / Log

## Overview

**Creative North Star: “Read the contract before you send the request.”**

Schema / Log is a local MCP documentation notebook. Its job is to make a tool record legible: name, purpose, lifecycle, and details. The surface behaves like a field register rather than a documentation template or a chat screen.

## Colors

- Forest black `#101716` is the protocol room; dark green `#18241f` is the register surface.
- Acid `#d8ef55` marks active lifecycle and the registration action.
- Rust `#e06d4f` marks labels, deletion, and caution.
- Paper `#e7eadc` and moss `#aab8a7` hold reading hierarchy.
- Rules use `#40534a`; no gradient, glass, or blue SaaS default.

## Typography

- Compact sans handles the explanatory copy.
- Monospace is the product voice for tool names, lifecycle states, search, and record metadata.
- Labels are uppercase and small; the record title remains readable and sentence-like.

## Layout

- The first viewport contains the contract thesis, search/filter rail, new-record form, and the beginning of the register.
- Records are ruled rows with a selected lifecycle mark, not a set of floating cards.
- The form is a work order attached to the register so capture and review remain one flow.

## Elevation & Depth

The field is flat and instrument-like. A darker inset register and 1px rules establish depth; focus uses acid inset rules instead of shadows.

## Shapes

Controls use restrained 2px corners. Lifecycle chips may be compact rectangles, never large pills. Textareas are full-width field sheets.

## Components

- **Protocol header:** states the local, client-side scope.
- **Search/filter rail:** filters records without implying remote documentation search.
- **Registration form:** captures name, detail, and lifecycle into localStorage.
- **Register row:** shows tool identity, body, status, and a delete action.
- **Empty register:** explains the next useful action rather than presenting a placeholder card.

## Do's and Don'ts

- Do make lifecycle and tool identity visible before the detail text.
- Do keep localStorage behavior and local scope honest.
- Do let the register feel useful with one record.
- Don't imply an MCP server is verified, hosted, or remotely synced.
- Don't turn statuses into decorative badges or add generic documentation navigation.

