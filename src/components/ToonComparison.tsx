import { useState } from 'react';
import {
  Card,
  Title,
  Text,
  Button,
  Metric,
  Badge,
  Grid,
  Col,
  Flex,
  ProgressBar,
} from '@tremor/react';
import { ToonService } from '../services/toonService';
import type { Candle } from '../types/database';

interface ToonComparisonProps {
  candles: Candle[];
  symbol: string;
  interval: string;
}

export function ToonComparison({ candles, symbol, interval }: ToonComparisonProps) {
  const [format, setFormat] = useState<'toon' | 'json'>('toon');

  // Build the payload object (same object used for both TOON and JSON)
  const payloadObject = ToonService.buildAIPayloadObject(candles, symbol, interval, 20);

  // Generate both formats from the same object
  const toonData = ToonService.prepareAIPayload(candles, symbol, interval, 20);
  const jsonData = JSON.stringify(payloadObject, null, 2);

  // Calculate metrics - compare the actual payload object
  const comparison = ToonService.compareTokens(payloadObject);

  // Cost calculations (using GPT-4 pricing as example)
  const GPT4_COST_PER_1K = 0.03; // $0.03 per 1K input tokens
  const DAILY_REQUESTS = 100; // Assuming 100 AI requests per day

  const jsonCostPerRequest = (comparison.jsonTokens / 1000) * GPT4_COST_PER_1K;
  const toonCostPerRequest = (comparison.toonTokens / 1000) * GPT4_COST_PER_1K;

  const jsonDailyCost = jsonCostPerRequest * DAILY_REQUESTS;
  const toonDailyCost = toonCostPerRequest * DAILY_REQUESTS;
  const dailySavings = jsonDailyCost - toonDailyCost;

  const monthlySavings = dailySavings * 30;
  const yearlySavings = dailySavings * 365;

  const displayData = format === 'toon' ? toonData : jsonData;
  const charCount = displayData.length;

  return (
    <div className="space-y-4">
      {/* Metrics Overview */}
      <Card>
        <Title>TOON Optimization Metrics</Title>
        <Text className="mt-2">Token efficiency for AI processing</Text>

        <Grid numItemsSm={2} numItemsLg={4} className="gap-4 mt-6">
          <Col>
            <Text>JSON Tokens</Text>
            <Metric>{comparison.jsonTokens.toLocaleString()}</Metric>
          </Col>
          <Col>
            <Text>TOON Tokens</Text>
            <Metric className="text-green-600">{comparison.toonTokens.toLocaleString()}</Metric>
          </Col>
          <Col>
            <Text>Tokens Saved</Text>
            <Metric>{comparison.reduction.toLocaleString()}</Metric>
          </Col>
          <Col>
            <Text>Reduction</Text>
            <Metric className="text-emerald-600">{comparison.reductionPercent}</Metric>
          </Col>
        </Grid>

        <div className="mt-6">
          <Text className="mb-2">Token Usage Comparison</Text>
          <Flex className="gap-4">
            <div className="flex-1">
              <Text className="text-xs mb-1">JSON</Text>
              <ProgressBar value={100} color="blue" className="mt-1" />
              <Text className="text-xs mt-1">{comparison.jsonTokens} tokens</Text>
            </div>
            <div className="flex-1">
              <Text className="text-xs mb-1">TOON</Text>
              <ProgressBar
                value={(comparison.toonTokens / comparison.jsonTokens) * 100}
                color="green"
                className="mt-1"
              />
              <Text className="text-xs mt-1">{comparison.toonTokens} tokens</Text>
            </div>
          </Flex>
        </div>
      </Card>

      {/* Cost Savings */}
      <Card>
        <Title>Cost Savings Estimate</Title>
        <Text className="mt-2">
          Based on GPT-4 pricing (${GPT4_COST_PER_1K}/1K tokens) × {DAILY_REQUESTS} requests/day
        </Text>

        <Grid numItemsSm={3} className="gap-6 mt-6">
          <Col>
            <Text>Daily Savings</Text>
            <Metric className="text-green-600">${dailySavings.toFixed(2)}</Metric>
          </Col>
          <Col>
            <Text>Monthly Savings</Text>
            <Metric className="text-emerald-600">${monthlySavings.toFixed(2)}</Metric>
          </Col>
          <Col>
            <Text>Yearly Savings</Text>
            <Metric className="text-emerald-700">${yearlySavings.toFixed(2)}</Metric>
          </Col>
        </Grid>

        <div className="mt-6 p-4 rounded-tremor-default bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
          <Flex justifyContent="between" alignItems="center">
            <Text className="text-green-900 dark:text-green-100">
              <strong>{comparison.reductionPercent}</strong> reduction in token usage
            </Text>
            <Badge color="green" size="lg">
              Save ${yearlySavings.toFixed(0)}/year
            </Badge>
          </Flex>
        </div>
      </Card>

      {/* Format Comparison */}
      <Card>
        <Flex justifyContent="between" alignItems="center">
          <div>
            <Title>Data Format Viewer</Title>
            <Text className="mt-1">
              {format === 'toon' ? 'TOON Format' : 'JSON Format'} - {charCount.toLocaleString()} characters
            </Text>
          </div>
          <Button
            size="xs"
            variant="secondary"
            onClick={() => setFormat(format === 'json' ? 'toon' : 'json')}
            color={format === 'toon' ? 'green' : 'blue'}
          >
            Switch to {format === 'json' ? 'TOON' : 'JSON'}
          </Button>
        </Flex>

        <div className="mt-4 flex gap-2">
          <Badge color={format === 'toon' ? 'green' : 'blue'}>
            {format.toUpperCase()}
          </Badge>
          <Badge color="gray">
            {format === 'toon' ? comparison.toonTokens : comparison.jsonTokens} tokens
          </Badge>
          <Badge color="gray">
            {charCount} chars
          </Badge>
        </div>

        <pre className="mt-4 p-4 rounded-tremor-default text-xs overflow-auto max-h-96 bg-tremor-background-subtle dark:bg-dark-tremor-background-subtle text-tremor-content-strong dark:text-dark-tremor-content-strong border border-tremor-border dark:border-dark-tremor-border">
          {displayData}
        </pre>

        <Flex className="gap-2 mt-4">
          <Button
            size="xs"
            onClick={() => navigator.clipboard.writeText(displayData)}
          >
            Copy {format.toUpperCase()}
          </Button>
          <Button
            size="xs"
            variant="secondary"
            onClick={() => {
              const blob = new Blob([displayData], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${symbol}-${interval}-${format}.${format === 'toon' ? 'toon' : 'json'}`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Download
          </Button>
        </Flex>
      </Card>
    </div>
  );
}