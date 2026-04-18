'use client';

import { useCallback, useEffect, useState } from 'react';

interface TaggingCounts {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

interface BatchResult {
  post_id: string;
  word: string;
  status: 'completed';
  tags: string[];
}

type PanelState = 'idle' | 'running' | 'done' | 'error';

export function BulkTaggingPanel() {
  const [counts, setCounts] = useState<TaggingCounts | null>(null);
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [panelState, setPanelState] = useState<PanelState>('idle');
  const [results, setResults] = useState<BatchResult[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [processedCount, setProcessedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  const fetchCounts = useCallback(async () => {
    setLoadingCounts(true);
    try {
      const res = await fetch('/api/posts/tags/status');
      if (res.ok) {
        const data = (await res.json()) as { counts: TaggingCounts };
        setCounts(data.counts);
      }
    } catch {
      // ignore
    } finally {
      setLoadingCounts(false);
    }
  }, []);

  useEffect(() => {
    void fetchCounts();
  }, [fetchCounts]);

  const runBatch = useCallback(
    async (includeFailed: boolean) => {
      setPanelState('running');
      setResults([]);
      setErrorMsg(null);

      try {
        const res = await fetch('/api/posts/tags/batch-generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ include_failed: includeFailed }),
        });

        const data = (await res.json()) as {
          success: boolean;
          processed: number;
          failed: number;
          results: BatchResult[];
          error?: string;
        };

        if (!res.ok) {
          throw new Error(data.error ?? `HTTP ${res.status}`);
        }

        setProcessedCount(data.processed);
        setFailedCount(data.failed);
        setResults(data.results ?? []);
        setPanelState('done');
        void fetchCounts();
      } catch (e) {
        setErrorMsg((e as Error).message);
        setPanelState('error');
        void fetchCounts();
      }
    },
    [fetchCounts]
  );

  const untaggedCount = (counts?.pending ?? 0) + (counts?.failed ?? 0);
  const hasUntagged = untaggedCount > 0;

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid #E8E0D8',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <span style={{ fontSize: '20px' }}>🏷️</span>
        <div>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1B1B1B' }}>
            AI 一括タグ生成
          </h3>
          <p style={{ margin: 0, fontSize: '12px', color: '#8B8B8B' }}>
            未タグ投稿に Gemini が自動でタグを付けます
          </p>
        </div>
      </div>

      {/* Status counters */}
      {loadingCounts ? (
        <p style={{ fontSize: '13px', color: '#8B8B8B', margin: '0 0 16px' }}>読み込み中...</p>
      ) : counts ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            marginBottom: '16px',
          }}
        >
          {[
            { label: '合計', value: counts.total, color: '#1B1B1B', bg: '#F6F1EB' },
            { label: '未処理', value: counts.pending, color: '#E76F51', bg: '#FFF3EF' },
            { label: '完了', value: counts.completed, color: '#2D6A4F', bg: '#D8F3DC' },
            { label: '失敗', value: counts.failed, color: '#8B5CF6', bg: '#EDE9FE' },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: item.bg,
                borderRadius: '10px',
                padding: '8px 6px',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 700,
                  color: item.color,
                  lineHeight: 1,
                }}
              >
                {item.value}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '10px', color: '#555555' }}>{item.label}</p>
            </div>
          ))}
        </div>
      ) : null}

      {/* Progress bar when running */}
      {panelState === 'running' && (
        <div style={{ marginBottom: '16px' }}>
          <div
            style={{
              height: '6px',
              background: '#E8E0D8',
              borderRadius: '3px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: '60%',
                background: 'linear-gradient(90deg, #2D6A4F, #52B788)',
                borderRadius: '3px',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          </div>
          <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#2D6A4F' }}>
            Gemini が処理中です... しばらくお待ちください
          </p>
        </div>
      )}

      {/* Result summary */}
      {panelState === 'done' && (
        <div
          style={{
            background: processedCount > 0 ? '#D8F3DC' : '#F6F1EB',
            borderRadius: '10px',
            padding: '12px 14px',
            marginBottom: '16px',
          }}
        >
          <p style={{ margin: 0, fontSize: '13px', color: '#2D6A4F', fontWeight: 600 }}>
            ✅ 完了しました
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#555555' }}>
            {processedCount}件 タグ生成成功
            {failedCount > 0 ? `、${failedCount}件 失敗` : ''}
          </p>

          {/* Results list */}
          {results.length > 0 && (
            <div style={{ marginTop: '10px', maxHeight: '160px', overflowY: 'auto' }}>
              {results.map((r) => (
                <div
                  key={r.post_id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    padding: '4px 0',
                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#1B1B1B', minWidth: '80px' }}>
                    {r.word}
                  </span>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {r.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: '10px',
                          background: '#fff',
                          border: '1px solid #D8F3DC',
                          borderRadius: '6px',
                          padding: '1px 6px',
                          color: '#2D6A4F',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {panelState === 'error' && errorMsg && (
        <div
          style={{
            background: '#FFF3EF',
            borderRadius: '10px',
            padding: '12px 14px',
            marginBottom: '16px',
          }}
        >
          <p style={{ margin: 0, fontSize: '13px', color: '#E76F51', fontWeight: 600 }}>
            ⚠️ エラーが発生しました
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#555555', wordBreak: 'break-all' }}>
            {errorMsg}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          disabled={panelState === 'running' || !hasUntagged}
          onClick={() => void runBatch(false)}
          style={{
            flex: 1,
            padding: '10px 16px',
            background: hasUntagged && panelState !== 'running' ? '#2D6A4F' : '#E8E0D8',
            color: hasUntagged && panelState !== 'running' ? '#fff' : '#8B8B8B',
            border: 'none',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: hasUntagged && panelState !== 'running' ? 'pointer' : 'not-allowed',
            transition: 'opacity 0.2s',
          }}
        >
          {panelState === 'running' ? '⏳ 処理中...' : `🤖 未処理を一括タグ生成 (${counts?.pending ?? 0}件)`}
        </button>

        {(counts?.failed ?? 0) > 0 && panelState !== 'running' && (
          <button
            type="button"
            onClick={() => void runBatch(true)}
            style={{
              padding: '10px 14px',
              background: 'transparent',
              color: '#8B5CF6',
              border: '1px solid #8B5CF6',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            🔄 失敗分も再試行 ({counts?.failed}件)
          </button>
        )}

        <button
          type="button"
          onClick={() => void fetchCounts()}
          disabled={loadingCounts || panelState === 'running'}
          style={{
            padding: '10px 12px',
            background: 'transparent',
            color: '#8B8B8B',
            border: '1px solid #E8E0D8',
            borderRadius: '10px',
            fontSize: '13px',
            cursor: 'pointer',
          }}
          title="更新"
        >
          🔃
        </button>
      </div>

      {!hasUntagged && panelState === 'idle' && counts !== null && (
        <p style={{ margin: '10px 0 0', fontSize: '12px', color: '#8B8B8B', textAlign: 'center' }}>
          すべての投稿にタグが付いています ✨
        </p>
      )}
    </div>
  );
}
