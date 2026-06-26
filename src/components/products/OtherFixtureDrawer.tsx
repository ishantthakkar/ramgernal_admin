"use client";

import { useCallback, useEffect, useState } from "react";
import { X, Trash2, Loader2, Hammer } from "lucide-react";
import { toast } from "react-toastify";
import { adminApi } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import styles from "./OtherFixtureDrawer.module.css";

export interface OtherFixtureItem {
  id: string;
  name: string;
}

interface OtherFixtureDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

function mapOtherFixture(raw: Record<string, unknown>): OtherFixtureItem {
  return {
    id: String(raw._id ?? raw.id),
    name: String(raw.name ?? ""),
  };
}

export function OtherFixtureDrawer({
  isOpen,
  onClose,
  onDeleted,
}: OtherFixtureDrawerProps) {
  const [fixtures, setFixtures] = useState<OtherFixtureItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const canDelete =
    hasPermission("Products", "delete") || hasPermission("Products", "edit");

  const fetchOtherFixtures = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.getOtherFixtures();
      const list = (response.products || []).map((item: Record<string, unknown>) =>
        mapOtherFixture(item)
      );
      setFixtures(list);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load other fixtures";
      toast.error(message);
      setFixtures([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchOtherFixtures();
    }
  }, [isOpen, fetchOtherFixtures]);

  async function handleDelete(fixture: OtherFixtureItem) {
    if (!canDelete) {
      toast.error("You do not have permission to delete other fixtures.");
      return;
    }

    const confirmed = window.confirm(
      `Delete other fixture "${fixture.name}"? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(fixture.id);
    try {
      await adminApi.deleteProduct(fixture.id);
      toast.success(`"${fixture.name}" deleted.`);
      setFixtures((prev) => prev.filter((item) => item.id !== fixture.id));
      onDeleted?.();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to delete other fixture";
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  }

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <aside
        className={styles.drawer}
        onClick={(e) => e.stopPropagation()}
        aria-label="Other fixtures panel"
      >
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <div className={styles.headerIcon}>
              <Hammer size={20} />
            </div>
            <div>
              <h2>Other Fixtures</h2>
              <p>Custom names added during surveys</p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close panel"
          >
            <X size={22} />
          </button>
        </div>

        <div className={styles.body}>
          {loading ? (
            <div className={styles.loadingState}>
              <Loader2 size={28} className={styles.spinner} />
              <span>Loading other fixtures...</span>
            </div>
          ) : fixtures.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No other fixtures yet.</p>
              <span>
                When a sales person selects Other and enters a name during a survey,
                it will appear here.
              </span>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th className={styles.actionsCol}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fixtures.map((fixture) => (
                  <tr key={fixture.id}>
                    <td>{fixture.name}</td>
                    <td className={styles.actionsCol}>
                      {canDelete ? (
                        <button
                          type="button"
                          className={styles.deleteBtn}
                          onClick={() => handleDelete(fixture)}
                          disabled={deletingId === fixture.id}
                          aria-label={`Delete ${fixture.name}`}
                          title="Delete"
                        >
                          {deletingId === fixture.id ? (
                            <Loader2 size={16} className={styles.spinner} />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      ) : (
                        <span className={styles.noAction}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </aside>
    </div>
  );
}
