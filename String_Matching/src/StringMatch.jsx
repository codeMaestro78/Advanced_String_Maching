import React, { useState, useEffect } from "react";

const StringMatchingVisualizer = () => {
  // State setup
  const [text, setText] = useState("");
  const [pattern, setPattern] = useState("");
  const [algorithm, setAlgorithm] = useState("naive");
  const [speed, setSpeed] = useState(500);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState([]);
  const [comparisons, setComparisons] = useState(0);
  const [matches, setMatches] = useState([]);
  const [prefixTable, setPrefixTable] = useState([]);
  const [currentHash, setCurrentHash] = useState(null);
  const [comparisonHistory, setComparisonHistory] = useState([]);

  // Reset everything when text, pattern or algorithm changes
  useEffect(() => {
    resetVisualization();
  }, [text, pattern, algorithm]);

  const resetVisualization = () => {
    setIsRunning(false);
    setCurrentStep(0);
    setSteps([]);
    setComparisons(0);
    setMatches([]);
    setPrefixTable([]);
    setCurrentHash(null);
    setComparisonHistory([]);
  };

  // Pick which algorithm to use
  const generateSteps = () => {
    let steps = [];
    setComparisons(0);

    if (algorithm === "naive") {
      steps = naiveStringMatching();
    } else if (algorithm === "kmp") {
      steps = kmpStringMatching();
    } else if (algorithm === "rabin-karp") {
      steps = rabinKarpStringMatching();
    }

    setSteps(steps);
    return steps;
  };

  // Good old brute force approach
  const naiveStringMatching = () => {
    const steps = [];
    const foundMatches = [];
    let totalComparisons = 0;
    const history = [];

    // For each possible starting position in the text
    for (let i = 0; i <= text.length - pattern.length; i++) {
      let j;
      const currentComparisons = [];
      let stepComparisons = 0;

      // Try to match pattern starting at position i
      for (j = 0; j < pattern.length; j++) {
        // Keep track of what we're comparing
        currentComparisons.push({
          textIndex: i + j,
          patternIndex: j,
          match: text[i + j] === pattern[j],
        });
        totalComparisons++;
        stepComparisons++;

        // Break early if mismatch found
        if (text[i + j] !== pattern[j]) {
          break;
        }
      }

      history.push({
        step: i,
        comparisons: stepComparisons,
        totalComparisons: totalComparisons,
      });

      // Add this step to our visualization
      steps.push({
        textIndex: i,
        patternIndex: 0,
        comparisons: [...currentComparisons],
        totalComparisons: totalComparisons,
        description:
          j === pattern.length
            ? `Match found at position ${i}!`
            : `Mismatch at position ${i + j}, shifting pattern.`,
      });

      // If we made it through the whole pattern, we found a match
      if (j === pattern.length) {
        foundMatches.push(i);
      }
    }

    setMatches(foundMatches);
    setComparisons(totalComparisons);
    setComparisonHistory(history);
    return steps;
  };

  // Helper function for KMP - builds the prefix table
  const computeKMPPrefixTable = () => {
    const lps = Array(pattern.length).fill(0);
    let len = 0;
    let i = 1;

    while (i < pattern.length) {
      if (pattern[i] === pattern[len]) {
        // Found matching prefix-suffix
        len++;
        lps[i] = len;
        i++;
      } else {
        if (len !== 0) {
          // Try shorter prefix
          len = lps[len - 1];
        } else {
          // No matching prefix found
          lps[i] = 0;
          i++;
        }
      }
    }

    setPrefixTable(lps);
    return lps;
  };

  // KMP algorithm - uses prefix table to skip redundant comparisons
  const kmpStringMatching = () => {
    // First get our prefix table
    const lps = computeKMPPrefixTable();
    const steps = [];
    const foundMatches = [];
    let totalComparisons = 0;
    const history = [];

    let i = 0; // index for text
    let j = 0; // index for pattern
    let step = 0;

    while (i < text.length) {
      const currentComparisons = [];
      let stepComparisons = 0;

      // Record what we're comparing
      currentComparisons.push({
        textIndex: i,
        patternIndex: j,
        match: text[i] === pattern[j],
      });
      totalComparisons++;
      stepComparisons++;

      if (text[i] === pattern[j]) {
        // Characters match, move both pointers
        i++;
        j++;
      }

      // Check if we've found a complete match
      if (j === pattern.length) {
        foundMatches.push(i - j);
        steps.push({
          textIndex: i - j,
          patternIndex: 0,
          comparisons: [...currentComparisons],
          totalComparisons: totalComparisons,
          description: `Match found at position ${i - j}!`,
          prefixUse: null,
        });

        history.push({
          step: step++,
          comparisons: stepComparisons,
          totalComparisons: totalComparisons,
        });

        // Use prefix table to slide pattern
        j = lps[j - 1];
      }
      // Handle mismatches
      else if (i < text.length && text[i] !== pattern[j]) {
        if (j !== 0) {
          // Use the prefix table to skip redundant comparisons
          const prefixUse = {
            oldJ: j,
            newJ: lps[j - 1],
          };
          j = lps[j - 1];

          steps.push({
            textIndex: i - j,
            patternIndex: 0,
            comparisons: [...currentComparisons],
            totalComparisons: totalComparisons,
            description: `Mismatch, using prefix table to shift pattern.`,
            prefixUse: prefixUse,
          });
        } else {
          // At start of pattern, just move text pointer
          steps.push({
            textIndex: i - j,
            patternIndex: 0,
            comparisons: [...currentComparisons],
            totalComparisons: totalComparisons,
            description: `Mismatch at beginning of pattern, moving to next position.`,
            prefixUse: null,
          });
          i++;
        }

        history.push({
          step: step++,
          comparisons: stepComparisons,
          totalComparisons: totalComparisons,
        });
      }
    }

    setMatches(foundMatches);
    setComparisons(totalComparisons);
    setComparisonHistory(history);
    return steps;
  };

  // Rabin-Karp algorithm - uses hashing to speed up comparison
  const rabinKarpStringMatching = () => {
    const prime = 101; // Just a small prime number for our demo
    const steps = [];
    const foundMatches = [];
    let totalComparisons = 0;
    const history = [];

    // Hash function for strings
    const calculateHash = (str, start, end) => {
      let hash = 0;
      for (let i = start; i < end; i++) {
        hash = (hash * 256 + str.charCodeAt(i)) % prime;
      }
      return hash;
    };

    // Get pattern hash once
    const patternHash = calculateHash(pattern, 0, pattern.length);

    // Get hash of first window of text
    let textHash = calculateHash(text, 0, pattern.length);

    // Slide window through text
    for (let i = 0; i <= text.length - pattern.length; i++) {
      const currentComparisons = [];
      let hashMatch = textHash === patternHash;
      let stepComparisons = 0;

      // Store current hash values for visualization
      setCurrentHash({
        patternHash,
        textHash,
        hashMatch,
      });

      // Hash comparison counts as a comparison
      stepComparisons++;
      totalComparisons++;

      // Only check character by character if hash matches
      if (hashMatch) {
        let j;
        for (j = 0; j < pattern.length; j++) {
          currentComparisons.push({
            textIndex: i + j,
            patternIndex: j,
            match: text[i + j] === pattern[j],
          });
          totalComparisons++;
          stepComparisons++;

          // Break early on mismatch
          if (text[i + j] !== pattern[j]) {
            break;
          }
        }

        // Check if we found a match
        if (j === pattern.length) {
          foundMatches.push(i);
          steps.push({
            textIndex: i,
            patternIndex: 0,
            comparisons: [...currentComparisons],
            totalComparisons: totalComparisons,
            description: `Hash match! Confirmed match at position ${i}.`,
            hashInfo: {
              patternHash,
              textHash,
              hashMatch: true,
            },
          });
        } else {
          // Hash collision but strings don't match
          steps.push({
            textIndex: i,
            patternIndex: 0,
            comparisons: [...currentComparisons],
            totalComparisons: totalComparisons,
            description: `Hash match but actual string mismatch (spurious hit).`,
            hashInfo: {
              patternHash,
              textHash,
              hashMatch: true,
              spurious: true,
            },
          });
        }
      } else {
        // Hashes don't match, no need to check characters
        steps.push({
          textIndex: i,
          patternIndex: 0,
          comparisons: [],
          totalComparisons: totalComparisons,
          description: `Hash mismatch, skipping detailed comparison.`,
          hashInfo: {
            patternHash,
            textHash,
            hashMatch: false,
          },
        });
      }

      history.push({
        step: i,
        comparisons: stepComparisons,
        totalComparisons: totalComparisons,
      });

      // Calculate rolling hash for next window (clever trick to avoid recalculating whole hash)
      if (i < text.length - pattern.length) {
        // Remove leftmost character and add rightmost character
        textHash =
          ((textHash -
            ((text.charCodeAt(i) * Math.pow(256, pattern.length - 1)) % prime) +
            prime) *
            256 +
            text.charCodeAt(i + pattern.length)) %
          prime;
      }
    }

    setMatches(foundMatches);
    setComparisons(totalComparisons);
    setComparisonHistory(history);
    return steps;
  };

  // Run the visualization with animation
  const startVisualization = () => {
    const generatedSteps = generateSteps();
    if (generatedSteps.length === 0) return;

    setIsRunning(true);
    setCurrentStep(0);

    // Set up interval for animation
    const interval = setInterval(() => {
      setCurrentStep((prevStep) => {
        const nextStep = prevStep + 1;
        // Stop when we reach the end
        if (nextStep >= generatedSteps.length) {
          clearInterval(interval);
          setIsRunning(false);
          return prevStep;
        }
        return nextStep;
      });
    }, speed);

    // Cleanup function
    return () => clearInterval(interval);
  };

  // Get current step data for rendering
  const currentStepData = steps[currentStep] || {};

  return (
    <div className="p-4 max-w-6xl mx-auto bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">
        String Matching Algorithm Visualizer
      </h1>

      {/* Input Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Text
          </label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isRunning}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pattern
          </label>
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            disabled={isRunning}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Algorithm Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Algorithm
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setAlgorithm("naive")}
            disabled={isRunning}
            className={`px-4 py-2 rounded ${
              algorithm === "naive" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            Naive
          </button>
          <button
            onClick={() => setAlgorithm("kmp")}
            disabled={isRunning}
            className={`px-4 py-2 rounded ${
              algorithm === "kmp" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            KMP
          </button>
          <button
            onClick={() => setAlgorithm("rabin-karp")}
            disabled={isRunning}
            className={`px-4 py-2 rounded ${
              algorithm === "rabin-karp"
                ? "bg-blue-600 text-white"
                : "bg-gray-200"
            }`}
          >
            Rabin-Karp
          </button>
        </div>
      </div>

      {/* Speed Control */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Animation Speed: {speed}ms
        </label>
        <input
          type="range"
          min="100"
          max="2000"
          step="100"
          value={speed}
          onChange={(e) => setSpeed(parseInt(e.target.value))}
          disabled={isRunning}
          className="w-full"
        />
      </div>

      {/* Visualization Controls */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={startVisualization}
          disabled={isRunning || text.length === 0 || pattern.length === 0}
          className="px-4 py-2 bg-green-600 text-white rounded disabled:bg-gray-300"
        >
          Start
        </button>
        <button
          onClick={resetVisualization}
          disabled={isRunning}
          className="px-4 py-2 bg-red-600 text-white rounded disabled:bg-gray-300"
        >
          Reset
        </button>
      </div>

      {/* Visualization Area */}
      <div className="border rounded p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">Visualization</h2>

        {/* Text characters with highlighting */}
        <div className="flex flex-wrap mb-4 font-mono">
          {text.split("").map((char, index) => {
            const isCompared = currentStepData.comparisons?.some(
              (c) => c.textIndex === index
            );
            const isMatch = currentStepData.comparisons?.some(
              (c) => c.textIndex === index && c.match
            );
            const isMismatch = currentStepData.comparisons?.some(
              (c) => c.textIndex === index && !c.match
            );
            const isPatternStart = index === currentStepData.textIndex;

            return (
              <div
                key={index}
                className={`w-8 h-8 flex items-center justify-center border ${
                  isPatternStart
                    ? "border-blue-500 border-2"
                    : "border-gray-200"
                } ${
                  isMatch
                    ? "bg-green-200"
                    : isMismatch
                    ? "bg-red-200"
                    : isCompared
                    ? "bg-yellow-100"
                    : ""
                }`}
              >
                {char}
              </div>
            );
          })}
        </div>

        {/* Pattern positioning */}
        <div className="flex mb-4">
          {/* Spaces before pattern */}
          {Array(currentStepData.textIndex || 0)
            .fill(" ")
            .map((_, i) => (
              <div key={i} className="w-8 h-8"></div>
            ))}
          {/* Pattern characters */}
          {pattern.split("").map((char, index) => (
            <div
              key={index}
              className={`w-8 h-8 flex items-center justify-center border border-blue-500 ${
                currentStepData.comparisons?.some(
                  (c) => c.patternIndex === index && c.match
                )
                  ? "bg-green-200"
                  : currentStepData.comparisons?.some(
                      (c) => c.patternIndex === index && !c.match
                    )
                  ? "bg-red-200"
                  : "bg-blue-100"
              }`}
            >
              {char}
            </div>
          ))}
        </div>

        {/* KMP-specific information */}
        {algorithm === "kmp" && prefixTable.length > 0 && (
          <div className="mb-4">
            <h3 className="text-md font-semibold mb-1">KMP Prefix Table:</h3>
            <div className="flex flex-wrap font-mono">
              {pattern.split("").map((char, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center mr-2 mb-2"
                >
                  <div className="w-8 h-8 flex items-center justify-center border border-gray-300">
                    {char}
                  </div>
                  <div className="w-8 h-8 flex items-center justify-center border border-gray-300 bg-blue-100">
                    {prefixTable[index]}
                  </div>
                </div>
              ))}
            </div>
            {currentStepData.prefixUse && (
              <div className="text-sm text-blue-600">
                Shifted pattern using prefix table: j changed from{" "}
                {currentStepData.prefixUse.oldJ} to{" "}
                {currentStepData.prefixUse.newJ}
              </div>
            )}
          </div>
        )}

        {/* Rabin-Karp-specific information */}
        {algorithm === "rabin-karp" && currentStepData.hashInfo && (
          <div className="mb-4">
            <h3 className="text-md font-semibold mb-1">Hash Information:</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Pattern Hash: {currentStepData.hashInfo.patternHash}</div>
              <div>Text Window Hash: {currentStepData.hashInfo.textHash}</div>
              <div
                className={
                  currentStepData.hashInfo.hashMatch
                    ? "text-green-600 font-bold"
                    : "text-red-600"
                }
              >
                {currentStepData.hashInfo.hashMatch
                  ? "Hashes Match!"
                  : "Hashes Different"}
              </div>
              {currentStepData.hashInfo.spurious && (
                <div className="text-orange-600 font-bold">
                  Spurious Hit (false positive)
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status and Statistics */}
        <div className="bg-gray-100 p-2 rounded">
          <p className="font-semibold">
            {currentStepData.description || "Ready to start visualization"}
          </p>
          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
            <div>
              Current Step: {currentStep + 1} of {steps.length}
            </div>
            <div>
              Total Comparisons: {currentStepData.totalComparisons || 0}
            </div>
            <div>Matches Found: {matches.length}</div>
            {matches.length > 0 && (
              <div>Match Positions: {matches.join(", ")}</div>
            )}
          </div>
        </div>
      </div>

      {/* Algorithm Explanation */}
      <div className="border rounded p-4">
        <h2 className="text-lg font-semibold mb-2">Algorithm Explanation</h2>
        {algorithm === "naive" && (
          <div>
            <p className="mb-2">
              The Naive algorithm compares the pattern with the text at each
              position, shifting one character at a time.
            </p>
            <p className="mb-2">
              Time Complexity: O(m*n) where m is pattern length and n is text
              length.
            </p>
            <p>
              This approach works well for small texts but becomes inefficient
              for larger ones.
            </p>
          </div>
        )}
        {algorithm === "kmp" && (
          <div>
            <p className="mb-2">
              The KMP algorithm uses a prefix table to avoid unnecessary
              comparisons by remembering previously matched characters.
            </p>
            <p className="mb-2">
              Time Complexity: O(m+n) where m is pattern length and n is text
              length.
            </p>
            <p>
              The prefix table allows the algorithm to skip comparisons by
              leveraging partially matched patterns.
            </p>
          </div>
        )}
        {algorithm === "rabin-karp" && (
          <div>
            <p className="mb-2">
              The Rabin-Karp algorithm uses a rolling hash function to quickly
              identify potential matches.
            </p>
            <p className="mb-2">
              Time Complexity: Average O(n+m), Worst case O(n*m) where m is
              pattern length and n is text length.
            </p>
            <p>
              It calculates a hash value for the pattern and each window of the
              text, only comparing characters when hashes match.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StringMatchingVisualizer;
