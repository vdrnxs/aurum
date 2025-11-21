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
      {/* Unified Optimization Card */}
      <Card>
        <Title>TOON Optimization</Title>
        <Text className="mt-1 text-gray-500 mb-6">
          Token efficiency and cost savings analysis
        </Text>

        {/* Token Metrics */}
        <Grid numItemsSm={2} numItemsLg={4} className="gap-4 mb-6">
          <Col>
            <Text className="text-xs text-gray-500">JSON Tokens</Text>
            <Metric className="mt-1">{comparison.jsonTokens.toLocaleString()}</Metric>
          </Col>
          <Col>
            <Text className="text-xs text-gray-500">TOON Tokens</Text>
            <Metric className="mt-1">{comparison.toonTokens.toLocaleString()}</Metric>
          </Col>
          <Col>
            <Text className="text-xs text-gray-500">Tokens Saved</Text>
            <Metric className="mt-1">{comparison.reduction.toLocaleString()}</Metric>
          </Col>
          <Col>
            <Text className="text-xs text-gray-500">Efficiency Gain</Text>
            <Metric className="mt-1">{comparison.reductionPercent}</Metric>
          </Col>
        </Grid>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700 my-6"></div>

        {/* Cost Savings */}
        <div>
          <Text className="text-sm font-medium mb-4">
            Cost Savings (GPT-4: ${GPT4_COST_PER_1K}/1K tokens × {DAILY_REQUESTS} req/day)
          </Text>
          <Grid numItemsSm={3} className="gap-4">
            <Col>
              <Text className="text-xs text-gray-500">Daily</Text>
              <Metric className="mt-1">${dailySavings.toFixed(2)}</Metric>
              <Text className="text-xs text-gray-400 mt-1">
                ${jsonDailyCost.toFixed(2)} → ${toonDailyCost.toFixed(2)}
              </Text>
            </Col>
            <Col>
              <Text className="text-xs text-gray-500">Monthly</Text>
              <Metric className="mt-1">${monthlySavings.toFixed(2)}</Metric>
              <Text className="text-xs text-gray-400 mt-1">
                ${(jsonDailyCost * 30).toFixed(2)} → ${(toonDailyCost * 30).toFixed(2)}
              </Text>
            </Col>
            <Col>
              <Text className="text-xs text-gray-500">Yearly</Text>
              <Metric className="mt-1">${yearlySavings.toFixed(2)}</Metric>
              <Text className="text-xs text-gray-400 mt-1">
                ${(jsonDailyCost * 365).toFixed(2)} → ${(toonDailyCost * 365).toFixed(2)}
              </Text>
            </Col>
          </Grid>
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