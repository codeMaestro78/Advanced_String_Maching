import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const StringMatchingVisualizer = () => {
  const [text, setText] = useState("ABABDABACDABABCABAB");
  const [pattern, setPattern] = useState("ABABCABAB");
  const [algorithm, setAlgorithm] = useState("naive");
  const [speed, setSpeed] = useState(500);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState([]);
  const [comparisons, setComparisons] = useState(0);
  const [matches, setMatches] = useState([]);
  const [prefixTable, setPrefixTable] = useState([]);
  const [currentHash, setCurrentHash] = useState(null);
  const [performanceData, setPerformanceData] = useState([]);
  const [comparisonHistory, setComparisonHistory] = useState([]);

  // Reset visualization when text, pattern or algorithm changes
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

  // Generate visualization steps based on selected algorithm
  const generateSteps = () => {
    let generatedSteps = [];
    setComparisons(0);

    switch (algorithm) {
      case "naive":
        generatedSteps = naiveStringMatching();
        break;
      case "kmp":
        generatedSteps = kmpStringMatching();
        break;
      case "rabin-karp":
        generatedSteps = rabinKarpStringMatching();
        break;
      default:
        break;
    }

    setSteps(generatedSteps);
    return generatedSteps;
  };

  // Naive string matching algorithm
  const naiveStringMatching = () => {
    const steps = [];
    const foundMatches = [];
    let totalComparisons = 0;
    const history = [];

    for (let i = 0; i <= text.length - pattern.length; i++) {
      let j;
      const currentComparisons = [];
      let stepComparisons = 0;

      for (j = 0; j < pattern.length; j++) {
        // Record each comparison
        currentComparisons.push({
          textIndex: i + j,
          patternIndex: j,
          match: text[i + j] === pattern[j],
        });
        totalComparisons++;
        stepComparisons++;

        if (text[i + j] !== pattern[j]) {
          break;
        }
      }

      // Add to comparison history
      history.push({
        step: i,
        comparisons: stepComparisons,
        totalComparisons: totalComparisons,
      });

      // Add step
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

      if (j === pattern.length) {
        foundMatches.push(i);
      }
    }

    setMatches(foundMatches);
    setComparisons(totalComparisons);
    setComparisonHistory(history);
    return steps;
  };

  // Compute KMP prefix table
  const computeKMPPrefixTable = () => {
    const lps = Array(pattern.length).fill(0);
    let len = 0;
    let i = 1;

    while (i < pattern.length) {
      if (pattern[i] === pattern[len]) {
        len++;
        lps[i] = len;
        i++;
      } else {
        if (len !== 0) {
          len = lps[len - 1];
        } else {
          lps[i] = 0;
          i++;
        }
      }
    }

    setPrefixTable(lps);
    return lps;
  };

  // KMP string matching algorithm
  const kmpStringMatching = () => {
    const lps = computeKMPPrefixTable();
    const steps = [];
    const foundMatches = [];
    let totalComparisons = 0;
    const history = [];

    let i = 0;
    let j = 0;
    let step = 0;

    while (i < text.length) {
      const currentComparisons = [];
      let stepComparisons = 0;

      // Record the comparison
      currentComparisons.push({
        textIndex: i,
        patternIndex: j,
        match: text[i] === pattern[j],
      });
      totalComparisons++;
      stepComparisons++;

      if (text[i] === pattern[j]) {
        i++;
        j++;
      }

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

        j = lps[j - 1];
      } else if (i < text.length && text[i] !== pattern[j]) {
        if (j !== 0) {
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

  // Rabin-Karp string matching algorithm
  const rabinKarpStringMatching = () => {
    const prime = 101;
    const steps = [];
    const foundMatches = [];
    let totalComparisons = 0;
    const history = [];

    // Calculate hash for pattern and first window
    const calculateHash = (str, start, end) => {
      let hash = 0;
      for (let i = start; i < end; i++) {
        hash = (hash * 256 + str.charCodeAt(i)) % prime;
      }
      return hash;
    };

    const patternHash = calculateHash(pattern, 0, pattern.length);
    let textHash = calculateHash(text, 0, pattern.length);

    for (let i = 0; i <= text.length - pattern.length; i++) {
      const currentComparisons = [];
      let hashMatch = textHash === patternHash;
      let stepComparisons = 0;

      setCurrentHash({
        patternHash,
        textHash,
        hashMatch,
      });

      // Hash comparison counts as a comparison
      stepComparisons++;
      totalComparisons++;

      // If hashes match, check characters
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

          if (text[i + j] !== pattern[j]) {
            break;
          }
        }

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

      // Calculate hash for next window
      if (i < text.length - pattern.length) {
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

  // Generate performance data for all algorithms
  const generatePerformanceData = () => {
    // Text patterns of increasing length to test
    const textLengths = [10, 20, 50, 100, 200, 500, 1000];
    const results = [];

    // Generate random text of given length
    const generateRandomText = (length) => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      let result = "";
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    // Generate pattern (always 5% of text length)
    const generatePattern = (text) => {
      const patternLength = Math.max(3, Math.floor(text.length * 0.05));
      const startIndex = Math.floor(
        Math.random() * (text.length - patternLength)
      );
      return text.substring(startIndex, startIndex + patternLength);
    };

    // Count comparisons for each algorithm
    const countNaiveComparisons = (text, pattern) => {
      let comparisons = 0;
      for (let i = 0; i <= text.length - pattern.length; i++) {
        for (let j = 0; j < pattern.length; j++) {
          comparisons++;
          if (text[i + j] !== pattern[j]) break;
        }
      }
      return comparisons;
    };

    const countKMPComparisons = (text, pattern) => {
      let comparisons = 0;

      // Compute LPS array
      const lps = Array(pattern.length).fill(0);
      let len = 0;
      let i = 1;
      while (i < pattern.length) {
        comparisons++;
        if (pattern[i] === pattern[len]) {
          len++;
          lps[i] = len;
          i++;
        } else {
          if (len !== 0) {
            len = lps[len - 1];
          } else {
            lps[i] = 0;
            i++;
          }
        }
      }

      // KMP search
      i = 0;
      let j = 0;
      while (i < text.length) {
        comparisons++;
        if (text[i] === pattern[j]) {
          i++;
          j++;
        }

        if (j === pattern.length) {
          j = lps[j - 1];
        } else if (i < text.length && text[i] !== pattern[j]) {
          if (j !== 0) {
            j = lps[j - 1];
          } else {
            i++;
          }
        }
      }

      return comparisons;
    };

    const countRabinKarpComparisons = (text, pattern) => {
      const prime = 101;
      let comparisons = 0;

      const calculateHash = (str, start, end) => {
        let hash = 0;
        for (let i = start; i < end; i++) {
          hash = (hash * 256 + str.charCodeAt(i)) % prime;
        }
        return hash;
      };

      const patternHash = calculateHash(pattern, 0, pattern.length);
      let textHash = calculateHash(text, 0, pattern.length);

      for (let i = 0; i <= text.length - pattern.length; i++) {
        comparisons++; // Hash comparison

        if (textHash === patternHash) {
          for (let j = 0; j < pattern.length; j++) {
            comparisons++;
            if (text[i + j] !== pattern[j]) break;
          }
        }

        if (i < text.length - pattern.length) {
          textHash =
            ((textHash -
              ((text.charCodeAt(i) * Math.pow(256, pattern.length - 1)) %
                prime) +
              prime) *
              256 +
              text.charCodeAt(i + pattern.length)) %
            prime;
        }
      }

      return comparisons;
    };

    // Generate data for each text length
    for (const length of textLengths) {
      const sampleText = generateRandomText(length);
      const samplePattern = generatePattern(sampleText);

      const naiveComparisons = countNaiveComparisons(sampleText, samplePattern);
      const kmpComparisons = countKMPComparisons(sampleText, samplePattern);
      const rabinKarpComparisons = countRabinKarpComparisons(
        sampleText,
        samplePattern
      );

      results.push({
        textLength: length,
        naive: naiveComparisons,
        kmp: kmpComparisons,
        rabinKarp: rabinKarpComparisons,
      });
    }

    setPerformanceData(results);
  };

  useEffect(() => {
    generatePerformanceData();
  }, []);

  const startVisualization = () => {
    const generatedSteps = generateSteps();
    if (generatedSteps.length === 0) return;

    setIsRunning(true);
    setCurrentStep(0);

    const interval = setInterval(() => {
      setCurrentStep((prevStep) => {
        const nextStep = prevStep + 1;
        if (nextStep >= generatedSteps.length) {
          clearInterval(interval);
          setIsRunning(false);
          return prevStep;
        }
        return nextStep;
      });
    }, speed);

    return () => clearInterval(interval);
  };

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
          {Array(currentStepData.textIndex || 0)
            .fill(" ")
            .map((_, i) => (
              <div key={i} className="w-8 h-8"></div>
            ))}
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

        {/* Algorithm-specific information */}
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

      {/* Comparison Charts */}

      {/* Efficiency Comparison Bar Chart */}
      <div className="border rounded p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">Algorithm Efficiency</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                {
                  name: "Time Complexity",
                  naive: 80,
                  kmp: 40,
                  rabinKarp: 50,
                },
                {
                  name: "Space Complexity",
                  naive: 20,
                  kmp: 50,
                  rabinKarp: 40,
                },
                {
                  name: "Implementation Complexity",
                  naive: 20,
                  kmp: 70,
                  rabinKarp: 60,
                },
              ]}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis
                label={{
                  value: "Relative Complexity",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip />
              <Legend />
              <Bar dataKey="naive" name="Naive" fill="#8884d8" />
              <Bar dataKey="kmp" name="KMP" fill="#82ca9d" />
              <Bar dataKey="rabinKarp" name="Rabin-Karp" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          <p>
            Note: Lower values represent better efficiency. Values are relative
            and for educational purposes.
          </p>
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
