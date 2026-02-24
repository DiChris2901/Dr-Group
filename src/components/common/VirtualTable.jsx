import React, { useRef, useState, useEffect } from 'react';
import { Box, Typography, alpha } from '@mui/material';
import { FixedSizeList as VirtualList } from 'react-window';

/**
 * Custom hook to measure an element's size via ResizeObserver.
 */
export function useMeasure() {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const update = () => {
      const rect = element.getBoundingClientRect();
      setSize({ width: Math.floor(rect.width), height: Math.floor(rect.height) });
    };

    update();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }

    const ro = new ResizeObserver(() => update());
    ro.observe(element);
    return () => ro.disconnect();
  }, []);

  return [ref, size];
}

/**
 * Virtualized table component using react-window for large datasets.
 */
export default function VirtualTable({
  rows,
  columns,
  height = 520,
  rowHeight = 44,
  headerHeight = 44,
  emptyLabel = 'Sin datos para mostrar.'
}) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const [wrapRef, size] = useMeasure();

  const totalMinWidth = columns.reduce((sum, col) => sum + (col.width || 140), 0);
  const width = Math.max(size.width || 0, Math.min(totalMinWidth, size.width || totalMinWidth));

  return (
    <Box
      ref={wrapRef}
      sx={{
        width: '100%',
        borderRadius: 2,
        border: (t) => `1px solid ${alpha(t.palette.divider, 0.2)}`,
        overflow: 'hidden',
        bgcolor: 'background.paper'
      }}
    >
      <Box
        sx={{
          height: headerHeight,
          display: 'flex',
          alignItems: 'center',
          bgcolor: (t) => alpha(t.palette.primary.main, 0.06),
          borderBottom: (t) => `1px solid ${alpha(t.palette.divider, 0.2)}`
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: columns.map((c) => `${c.width || 140}px`).join(' '),
            width: totalMinWidth,
            px: 1.5,
            columnGap: 0,
            alignItems: 'center'
          }}
        >
          {columns.map((col) => (
            <Typography
              key={col.key}
              variant="caption"
              sx={{
                fontWeight: 600,
                color: 'text.secondary',
                textTransform: 'uppercase',
                letterSpacing: 0.6,
                pr: 1,
                textAlign: col.align || 'left',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis'
              }}
              title={col.label}
            >
              {col.label}
            </Typography>
          ))}
        </Box>
      </Box>

      {safeRows.length === 0 ? (
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {emptyLabel}
          </Typography>
        </Box>
      ) : size.width > 0 ? (
        <Box sx={{ overflowX: 'auto' }}>
          <VirtualList
            height={height}
            width={Math.max(width, 0)}
            itemCount={safeRows.length}
            itemSize={rowHeight}
          >
            {({ index, style }) => {
              const row = safeRows[index];
              return (
                <Box
                  style={style}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    borderBottom: (t) => `1px solid ${alpha(t.palette.divider, 0.12)}`,
                    bgcolor: index % 2 === 0 ? 'transparent' : (t) => alpha(t.palette.action.hover, 0.08)
                  }}
                >
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: columns.map((c) => `${c.width || 140}px`).join(' '),
                      width: totalMinWidth,
                      px: 1.5,
                      alignItems: 'center'
                    }}
                  >
                    {columns.map((col) => {
                      const rawValue = typeof col.value === 'function' ? col.value(row) : row?.[col.key];
                      const displayValue = col.format ? col.format(rawValue, row) : rawValue;
                      const cellText = displayValue === null || displayValue === undefined || displayValue === '' ? '—' : String(displayValue);
                      return (
                        <Typography
                          key={col.key}
                          variant="body2"
                          sx={{
                            pr: 1,
                            textAlign: col.align || 'left',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis'
                          }}
                          title={cellText}
                        >
                          {cellText}
                        </Typography>
                      );
                    })}
                  </Box>
                </Box>
              );
            }}
          </VirtualList>
        </Box>
      ) : (
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Preparando tabla…
          </Typography>
        </Box>
      )}
    </Box>
  );
}

/**
 * Simple tab panel that only renders content when active.
 */
export function TabPanel({ value, index, children }) {
  if (value !== index) return null;
  return <Box sx={{ pt: 2 }}>{children}</Box>;
}
