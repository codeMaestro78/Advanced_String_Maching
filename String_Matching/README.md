# String Matching Visualizer

## Overview

String Matching Visualizer is a React-based application that demonstrates different string matching algorithms using interactive visualizations. It supports Naive, KMP (Knuth-Morris-Pratt), and Rabin-Karp algorithms, providing step-by-step execution with visual feedback.

## Features

- Supports three string matching algorithms:
  - Naive String Matching
  - Knuth-Morris-Pratt (KMP) Algorithm
  - Rabin-Karp Algorithm
- Step-by-step execution visualization
- Adjustable execution speed
- Performance data tracking
- Real-time comparison count and match visualization
- Graphical representation using Recharts

## Technologies Used

- **React.js** - Frontend framework
- **Recharts** - For graphical visualization
- **JavaScript (ES6+)** - Core language
- **CSS** - Styling

## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/codeMaestro78/Advanced_String_Maching.git
   ```
2. Navigate to the project directory:
   ```sh
   cd string-matching
   ```
3. Install dependencies:
   ```sh
   npm install
   ```
4. Start the development server:
   ```sh
   npm run dev
   ```

## Usage

1. Enter the text and pattern in the input fields.
2. Select the algorithm from the dropdown menu.
3. Adjust the execution speed if needed.
4. Click the "Start" button to begin visualization.
5. View the real-time comparisons, matches, and performance graphs.

## Project Structure

```

## Algorithms Implemented

### 1. Naive String Matching

- A simple brute-force approach that checks for pattern occurrences sequentially.

### 2. Knuth-Morris-Pratt (KMP) Algorithm

- Uses a prefix table (LPS array) to optimize searching.

### 3. Rabin-Karp Algorithm

- Utilizes a rolling hash function for efficient pattern searching.

