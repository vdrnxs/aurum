import { useState } from 'react';
import { Card, Title, Text, Button } from '@tremor/react';
import { SPACING, COMPONENTS } from '../lib/styles';

interface ToonViewerProps {
  toonData: string;
  jsonData: Record<string, any>;
}

export function ToonViewer({ toonData, jsonData }: ToonViewerProps) {
  const [format, setFormat] = useState<'toon' | 'json'>('toon');

  const formatStats = {
    toon: {
      size: new Blob([toonData]).size,
      label: 'TOON Format',
    },
    json: {
      size: new Blob([JSON.stringify(jsonData)]).size,
      label: 'JSON Format',
    },
  };

  const compression = (
    (1 - formatStats.toon.size / formatStats.json.size) *
    100
  ).toFixed(1);

  return (
    <Card>
      <div className="flex justify-between items-start">
        <div>
          <Title>Market Data</Title>
          <Text className={SPACING.mt.xs}>
            {format === 'toon' ? formatStats.toon.label : formatStats.json.label}
            {' • '}
            {formatStats[format].size.toLocaleString()} bytes
          </Text>
        </div>
        <div className={`flex ${SPACING.gap.sm}`}>
          <Button
            size="xs"
            variant={format === 'toon' ? 'primary' : 'secondary'}
            onClick={() => setFormat('toon')}
          >
            TOON
          </Button>
          <Button
            size="xs"
            variant={format === 'json' ? 'primary' : 'secondary'}
            onClick={() => setFormat('json')}
          >
            JSON
          </Button>
        </div>
      </div>

      <Text className={SPACING.mt.sm}>
        TOON compression: <strong>{compression}% smaller</strong> than JSON
      </Text>

      <div className={`${SPACING.mt.md} ${COMPONENTS.codeBlock}`}>
        <pre className="text-xs overflow-x-auto max-h-96">
          {format === 'toon' ? toonData : JSON.stringify(jsonData, null, 2)}
        </pre>
      </div>
    </Card>
  );
}
