# Coral Sim

A browser-based simulator for the [Coral programming language](https://corallanguage.org/spec/), designed for use in CIT 111. Write and step through Coral programs with live variable inspection and an auto-generated flowchart.

No installation required — open `index.html` in any modern browser.

---

## Getting Started

1. Open `index.html` in Chrome, Firefox, or Safari.
2. Write Coral code in the editor, or choose a sample from the **Load sample…** dropdown.
3. If your program reads input, enter space-separated values in the **Program Inputs** box.
4. Press **Execute** to compile the program.
5. Use **Step**, **Run**, or **Instant** to run it.

---

## The Editor

The code editor is on the left side of the workspace. It includes:

- **Syntax highlighting** — keywords, types, built-ins, strings, and numbers are color-coded.
- **Line numbers** — in the gutter to the left of the code.
- **Active line highlight** — a colored bar marks the line currently being executed during stepping.
- **Auto-save** — your code and inputs are automatically saved to the browser. If you accidentally close or refresh the page, your work is restored on next open (unless code was pre-loaded from a shared URL).

**Tab key** inserts three spaces. Coral requires 3-space indentation for all nested blocks.

To move keyboard focus out of the editor without the mouse, press **Escape** first, then **Tab**.

---

## Execution Controls

| Button | When available | What it does |
|---|---|---|
| **Execute** | Edit mode | Compiles the code. Switches to execution mode if successful. Shows an error in the output panel if compilation fails. |
| **Edit** | Execution mode | Returns to edit mode and resets everything. |
| **Step ▶** | Ready or Paused | Advances one step. Highlights the current line and updates the Variables panel. |
| **Restart ↺** | Any execution state | Resets to the beginning of the program without leaving execution mode. |
| **Run** | Ready or Paused | Runs automatically at the selected speed. |
| **Pause** | Running | Pauses auto-run so you can inspect variables or step manually. |
| **Speed slider** | Execution mode | Controls auto-run speed. Left = slowest (~3 sec/step). Right = fastest (~0.75 sec/step). |
| **Instant ⏭** | Ready or Paused | Runs the entire program immediately and shows the final output and variable state. |

---

## Status Bar

The colored dot and label below the toolbar show the current execution state:

| State | Dot color | Meaning |
|---|---|---|
| Edit Mode | Gray | You can edit the code and inputs. |
| Ready | Green | Compiled successfully. Press Step or Run to begin. |
| Running | Blue | Auto-running. Press Pause to stop. |
| Paused | Orange | Mid-execution. Resume with Run or advance with Step. |
| Complete | Green | Program finished. Press Edit to start over. |

The center of the status bar shows sub-step details during execution, such as:
- `for — checking condition` during a for loop's condition evaluation
- `in FunctionName` while executing inside a user-defined function
- `returning from FunctionName` on the extra pause after a function's last statement executes (so you can see the return value before leaving the function)

The right side shows the current step count (e.g., `Step 14`).

---

## Program Inputs

Enter space-separated values in the **Program Inputs** box before pressing Execute. The simulator reads them left to right each time a `Get next input` statement is reached.

Example — for a program that reads three numbers:
```
10 3 -1
```

The input box is single-line by default. Drag the bottom edge to expand it for longer input lists — the values can span multiple lines and will still be read correctly.

---

## Variables Panel

The **Variables** panel on the right side shows all declared variables and their current values as execution proceeds.

- A dash (**—**) means the variable has been declared but not yet assigned a value.
- **Array** variables show a sub-table with each index and its value. If the array size has not been set yet (for `array(?)` declarations), the sub-table shows "Size not yet assigned."
- When a value changes, the row briefly flashes to draw attention to the update.

For programs with user-defined functions, the panel shows separate sections for **Parameters**, **Local Variables**, and the **Return** variable while inside a function call. When the function finishes, the panel returns to showing the caller's variables.

---

## The Flowchart

After pressing Execute on a program **without** user-defined functions, switch to the **Flowchart** tab to see a visual flowchart of the program's structure.

- **Scroll wheel** or pinch — zoom in/out
- **Drag** — pan around the diagram
- **Fit** button — resets zoom to fit the entire chart on screen
- **+** / **−** buttons — manual zoom steps
- **Keyboard (when flowchart is focused):** `+` zoom in, `-` zoom out, `0` fit, Arrow keys pan

During stepping, the active flowchart node is highlighted in sync with the editor.

> Flowcharts are not generated for programs that use `Function` definitions.

---

## Color Themes

Use the **theme selector** in the header to switch color themes. Your choice is saved and restored on the next visit.

| Theme | Description |
|---|---|
| Classic Light | Clean white background with blue accent |
| Dyslexic Dark | Dark background, Lexend font, extra letter-spacing and line-height |
| Dyslexic Light | Light background, Lexend font, extra letter-spacing and line-height |
| High Contrast | Black/white with yellow highlight border — no color-only cues |
| Midnight Blue | Deep navy dark theme |
| Roadrunner Dark | RHC dark theme |
| Roadrunner Light | RHC light theme |
| Synthwave | Retro purple/pink neon dark theme |
| Voyager | Space inspired deep navy and teal |

All themes meet WCAG AA contrast requirements (4.5:1) for syntax-highlighted code on both normal and highlighted lines.

---

## Text Size

Use the **Text Size selector** in the header to scale the entire interface:

| Option | Best for |
|---|---|
| Normal | Default desktop use |
| Large | Larger monitors or personal preference |
| XL / Projector | Classroom display — readable from the back of the room |

Text size scales the entire UI, including the flowchart geometry and node sizes. Your selection is saved and restored on the next visit.

---

## Sample Programs

The **Load sample…** dropdown loads pre-written examples into the editor and pre-fills the input box. Selecting a sample replaces whatever is currently in the editor.

| Sample | What it demonstrates |
|---|---|
| Hello World | Basic `Put` output |
| Simple Math | Variable declarations, arithmetic, input |
| If/Else Branch | `if`/`elseif`/`else` with multiple conditions |
| While Loop | Sentinel-controlled `while` loop |
| For Loop | Counter-controlled `for` loop |
| Array Example | Fixed-size array, fill and print |
| Function Example (F→C) | User-defined function, float parameters, return value |

---

## Sharing Programs via URL

You can share a pre-loaded program as a URL using query parameters:

```
index.html?code=YOUR_CODE_HERE&input=YOUR_INPUTS_HERE
```

| Parameter | Description |
|---|---|
| `?code=` | URL-encoded Coral source code |
| `?input=` | URL-encoded input values |
| `?autorun=1` | Automatically press Execute when the page loads |

When a URL loads code, a blue banner appears at the top of the page confirming that the code came from a shared link.

---

## Output Formatting

- `Put x to output` — prints the value of `x`
- `Put x with 2 decimal places to output` — prints `x` rounded to 2 decimal places
- `Put "\n" to output` — prints a newline (line break)
- `float` variables always display at least one decimal place (e.g., `3.0`, not `3`)
- `integer` variables always display without a decimal point

---

## Language Reference

Full Coral language specification: [corallanguage.org/spec/](https://corallanguage.org/spec/)

---

## Complex Test Cases

Ready to go beyond the built-in samples? See **[test-cases.md](test-cases.md)** for ten more complex programs with full explanations and expected output, covering:

- Sentinel-controlled loops and running averages
- Min/max search in arrays
- Fibonacci sequence
- Bubble sort
- Built-in math functions (`RaiseToPower`, `SquareRoot`, etc.)
- Dynamic arrays with user-specified size
- GPA calculator using a helper function
- Collatz sequence
- Temperature conversion table with functions
- Two-pass array algorithm (count values above average)

---

## Acknowledgments

The Coral programming language was created by Frank Vahid, Roman Lysecky, and Alex Edgcomb.
Learn more at [corallanguage.org/about/](https://corallanguage.org/about/).

This simulator is an independent educational tool built for CIT 111 at Rio Hondo College.
It is not affiliated with or endorsed by zyBooks.
