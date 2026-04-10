# Coral Sim — Complex Test Cases

This file contains more advanced programs for testing and learning. Each test case includes the complete code, the inputs to paste into the **Program Inputs** box, and the expected output.

To run a test case:
1. Copy the code block into the editor (or clear the editor first)
2. Copy the input values into the **Program Inputs** box
3. Press **Execute**, then use **Step**, **Run**, or **Instant**

---

## Test 1: Running Average with Sentinel

**What it covers:** `while` loop with a sentinel value, mixing `integer` and `float` types, and a conditional guard before dividing.

**How it works:** The program reads numbers until the user enters `-999`. At the end it reports the count and the average. If no numbers were entered before the sentinel, it prints a message instead of dividing by zero.

```
integer num
integer count
float total
float average
count = 0
total = 0.0
num = Get next input
while num != -999
   total = total + num
   count = count + 1
   num = Get next input
if count > 0
   average = total / count
   Put "Count: " to output
   Put count to output
   Put "\n" to output
   Put "Average: " to output
   Put average with 2 decimal places to output
else
   Put "No numbers entered." to output
```

**Inputs:** `10 20 30 40 -999`

**Expected output:**
```
Count: 4
Average: 25.00
```

**Try also:** `100 -999` → Average: 100.00 | `-999` alone → "No numbers entered."

---

## Test 2: Find Min and Max in an Array

**What it covers:** Fixed-size array, filling via a `for` loop, and tracking min/max using a running comparison pattern.

**How it works:** The first pass fills the array. The second pass iterates from index 1 onward, comparing each element against the running min and max (seeded from `scores[0]`).

```
integer array(6) scores
integer i
integer min
integer max
for i = 0; i < 6; i = i + 1
   scores[i] = Get next input
min = scores[0]
max = scores[0]
for i = 1; i < 6; i = i + 1
   if scores[i] < min
      min = scores[i]
   if scores[i] > max
      max = scores[i]
Put "Min: " to output
Put min to output
Put "\n" to output
Put "Max: " to output
Put max to output
```

**Inputs:** `42 17 93 8 61 35`

**Expected output:**
```
Min: 8
Max: 93
```

**Try also:** `5 5 5 5 5 5` → Min and Max both 5 | `1 2 3 4 5 6` → Min: 1, Max: 6

---

## Test 3: Fibonacci Sequence

**What it covers:** `while` loop with a counter, the classic "swap with temp" pattern using three variables.

**How it works:** Starts with `a = 0` and `b = 1`. Each iteration prints `a`, then advances the pair by storing `a + b` in a temp variable before reassigning.

```
integer n
integer a
integer b
integer temp
integer count
n = Get next input
a = 0
b = 1
count = 0
while count < n
   Put a to output
   Put "\n" to output
   temp = a + b
   a = b
   b = temp
   count = count + 1
```

**Inputs:** `8`

**Expected output:**
```
0
1
1
2
3
5
8
13
```

**Try also:** `1` → just `0` | `12` → sequence up to 89

---

## Test 4: Bubble Sort

**What it covers:** Nested `for` loops, array element swapping, and a shrinking inner loop bound.

**How it works:** Outer loop runs n−1 passes. Inner loop compares adjacent pairs and swaps them if out of order. The bound `4 - i` means each pass does one fewer comparison, since the largest unsorted element "bubbles" to its correct position.

```
integer array(5) arr
integer i
integer j
integer temp
for i = 0; i < 5; i = i + 1
   arr[i] = Get next input
for i = 0; i < 4; i = i + 1
   for j = 0; j < 4 - i; j = j + 1
      if arr[j] > arr[j + 1]
         temp = arr[j]
         arr[j] = arr[j + 1]
         arr[j + 1] = temp
for i = 0; i < 5; i = i + 1
   Put arr[i] to output
   Put " " to output
```

**Inputs:** `64 34 25 12 22`

**Expected output:**
```
12 22 25 34 64 
```

**Try also:** `5 4 3 2 1` (reverse sorted) | `1 2 3 4 5` (already sorted — no swaps occur)

---

## Test 5: Powers Table with Built-in Functions

**What it covers:** `RaiseToPower()` built-in, `for` loop, `float` results formatted with `with 0 decimal places`.

**How it works:** For each integer from 1 to N, computes the square and cube using `RaiseToPower`, then prints them on one line. The `with 0 decimal places` formatting removes the decimal point for cleaner integer-like output.

```
integer n
integer i
float sq
float cube
n = Get next input
for i = 1; i <= n; i = i + 1
   sq = RaiseToPower(i, 2)
   cube = RaiseToPower(i, 3)
   Put i to output
   Put ": sq=" to output
   Put sq with 0 decimal places to output
   Put "  cube=" to output
   Put cube with 0 decimal places to output
   Put "\n" to output
```

**Inputs:** `5`

**Expected output:**
```
1: sq=1  cube=1
2: sq=4  cube=8
3: sq=9  cube=27
4: sq=16  cube=64
5: sq=25  cube=125
```

**Try also:** `10` to see the table extend | `1` for just the first row

---

## Test 6: Dynamic Array Statistics

**What it covers:** Dynamic-size array `array(?)`, setting `.size` from input, reading into a dynamically sized array, and computing sum, average, min, and max in a single program.

**How it works:** The first input value sets the array size. Subsequent inputs fill the array. A single pass then accumulates the total and tracks min/max simultaneously.

```
integer array(?) data
integer i
integer n
float total
float avg
integer min
integer max
n = Get next input
data.size = n
total = 0.0
for i = 0; i < data.size; i = i + 1
   data[i] = Get next input
   total = total + data[i]
min = data[0]
max = data[0]
for i = 1; i < data.size; i = i + 1
   if data[i] < min
      min = data[i]
   if data[i] > max
      max = data[i]
avg = total / data.size
Put "Sum: " to output
Put total with 0 decimal places to output
Put "\n" to output
Put "Average: " to output
Put avg with 2 decimal places to output
Put "\n" to output
Put "Min: " to output
Put min to output
Put "\n" to output
Put "Max: " to output
Put max to output
```

**Inputs:** `5  10 30 20 50 40`

**Expected output:**
```
Sum: 150
Average: 30.00
Min: 10
Max: 50
```

**Try also:** `3  100 200 300` | `1  42` (single element — min, max, and average all equal)

---

## Test 7: GPA Calculator with a Helper Function

**What it covers:** User-defined functions, `elseif` chains, calling a function inside a loop, and accumulating float return values.

**How it works:** `GradePoints` maps a numeric grade to quality points (4.0 scale). `Main` reads N grades, calls the function for each, and divides the total by N to produce a GPA.

```
Function GradePoints(integer grade) returns float points
   if grade >= 90
      points = 4.0
   elseif grade >= 80
      points = 3.0
   elseif grade >= 70
      points = 2.0
   elseif grade >= 60
      points = 1.0
   else
      points = 0.0

Function Main() returns nothing nothing
   integer n
   integer i
   integer grade
   float total
   float gpa
   n = Get next input
   total = 0.0
   for i = 0; i < n; i = i + 1
      grade = Get next input
      total = total + GradePoints(grade)
   gpa = total / n
   Put "GPA: " to output
   Put gpa with 2 decimal places to output
```

**Inputs:** `4  95 82 73 68`

**Expected output:**
```
GPA: 2.50
```

**Try also:** `3  90 90 90` → 4.00 | `5  55 55 55 55 55` → 0.00 | `2  89 90` → 3.50

---

## Test 8: Collatz Sequence

**What it covers:** `while` loop that runs until a value reaches 1, integer modulo (`%`) to check even/odd, and counting iterations.

**How it works:** If `n` is even, divide by 2. If odd, multiply by 3 and add 1. Repeat until `n == 1`. The conjecture is that every positive integer eventually reaches 1 — the step counter shows how many it takes.

```
integer n
integer steps
steps = 0
n = Get next input
while n != 1
   Put n to output
   Put " " to output
   if n % 2 == 0
      n = n / 2
   else
      n = n * 3 + 1
   steps = steps + 1
Put n to output
Put "\n" to output
Put "Steps: " to output
Put steps to output
```

**Inputs:** `6`

**Expected output:**
```
6 3 10 5 16 8 4 2 1
Steps: 8
```

**Try also:** `27` (takes 111 steps — a long run) | `1` (already at 1, Steps: 0) | `16` (pure powers-of-2 chain)

---

## Test 9: Temperature Conversion Table (Multiple Functions)

**What it covers:** Two unit-conversion functions, calling a function inside a loop, and formatting float output with `with 1 decimal places`.

**How it works:** `Main` reads how many temperatures to convert, then reads each one and prints both the Celsius input and the computed Fahrenheit result on the same line.

```
Function CelsiusToFahrenheit(float c) returns float f
   f = c * 9.0 / 5.0 + 32.0

Function Main() returns nothing nothing
   integer n
   integer i
   float temp
   float converted
   n = Get next input
   for i = 0; i < n; i = i + 1
      temp = Get next input
      converted = CelsiusToFahrenheit(temp)
      Put temp with 1 decimal places to output
      Put "C = " to output
      Put converted with 1 decimal places to output
      Put "F" to output
      Put "\n" to output
```

**Inputs:** `4  0 20 100 -40`

**Expected output:**
```
0.0C = 32.0F
20.0C = 68.0F
100.0C = 212.0F
-40.0C = -40.0F
```

**Note:** −40 is the crossover point where Celsius and Fahrenheit are equal — a good sanity check.

---

## Test 10: Count Values Above Average

**What it covers:** Two-pass array algorithm — first pass computes the average, second pass counts how many values exceed it. Combines dynamic arrays, float math, and an accumulator counter.

```
integer array(?) vals
integer i
integer n
integer count
float total
float avg
n = Get next input
vals.size = n
total = 0.0
for i = 0; i < vals.size; i = i + 1
   vals[i] = Get next input
   total = total + vals[i]
avg = total / vals.size
count = 0
for i = 0; i < vals.size; i = i + 1
   if vals[i] > avg
      count = count + 1
Put "Average: " to output
Put avg with 2 decimal places to output
Put "\n" to output
Put "Above average: " to output
Put count to output
```

**Inputs:** `6  10 20 30 40 50 60`

**Expected output:**
```
Average: 35.00
Above average: 3
```

**Try also:** `5  100 100 100 100 100` → Average: 100.00, Above average: 0 | `4  1 2 3 100` → Average: 26.50, Above average: 1
