import React from "react";
import { ROUTES } from "../../app/router/routes.js";
import T from "../../design/tokens.js";
import centcomApi from "../../domains/index.js";
import { TRUTH_CLASS } from "../../domains/shared/classification.js";
import { can } from "../../domains/shared/rbac.js";
import { relTime, shortDate } from "../../utils/format.js";
import { useResource, useViewport } from "../../app/hooks.js";
import { Breadcrumb, ClassBadge, EmptyState, Fact, GhostButton, Label, LineageRail, MetalText, Panel, PanelHeader, Resource, SeverityPill } from "../../components/common/primitives.jsx";

/**
 * FINDING DETAIL — the truth-traceability page.
 * Every claim CENTCOM makes about a property should be answerable here: what
 * was concluded, from which evidence, by which model version, and whether a
 * human has verified it.
 */
export function FindingDetail({ findingId, navigate }) {
  const res = useResource(() => centcomApi.getFinding(findingId), [findingId]);
  const vp = useViewport();

  return (
    <Resource
      res={res}
      loadingLines={5}
      label="Opening finding"
      empty={
        <Panel>
          <EmptyState
            title="No finding with that ID"
            hint={'"' + findingId + '" is not on file.'}
            action={<GhostButton onClick={() => navigate(ROUTES.properties)}>Back to Property Command</GhostButton>}
          />
        </Panel>
      }
    >
      {({ finding: f, analysis, prediction }) => (
        <div style={{ display: "flex", flexDirection: "column", gap: vp.gutter }}>
          <Panel>
            <Breadcrumb
              navigate={navigate}
              trail={[
                { label: "CENTCOM", to: ROUTES.dashboard },
                { label: "Properties", to: ROUTES.properties },
                { label: f.propertyId, to: ROUTES.property(f.propertyId) },
                { label: "Findings", to: ROUTES.property(f.propertyId, "findings") },
                { label: f.findingId },
              ]}
            />
            <MetalText size={vp.isPhone ? 18 : 23} track="0.04em">{f.title}</MetalText>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 11 }}>
              <ClassBadge classification={f.truthClassification} />
              <SeverityPill severity={f.severity} />
              {f.truthClassification === TRUTH_CLASS.PROBABLE && (
                <span style={{ fontFamily: T.font.mono, fontSize: 10, color: T.color.goldBright, alignSelf: "center" }}>
                  confidence {(f.confidence * 100).toFixed(0)}%
                </span>
              )}
            </div>
            <div style={{ fontFamily: T.font.body, fontSize: 12, color: T.color.textSoft, marginTop: 12, lineHeight: 1.6, maxWidth: 780 }}>
              {f.detail}
            </div>
            {f.truthClassification === TRUTH_CLASS.PROBABLE && (
              <div style={{ fontFamily: T.font.body, fontSize: 11, color: T.color.goldBright, marginTop: 10 }}>
                This is an inference, not a measurement. It stays labelled probable until a human verifies it against
                physical reality.
              </div>
            )}
          </Panel>

          <Panel>
            <PanelHeader title="Traceability" />
            <LineageRail
              navigate={navigate}
              steps={[
                { label: "Property", value: f.propertyId, to: ROUTES.property(f.propertyId) },
                { label: "Mission", value: f.missionId, to: ROUTES.mission(f.missionId) },
                { label: "Analysis", value: f.cortexAnalysisId, to: ROUTES.cortexAnalysis(f.cortexAnalysisId) },
                { label: "Finding", value: f.findingId, current: true },
                { label: "Review", value: f.reviewState },
                { label: "Passport", value: f.passportState, to: ROUTES.property(f.propertyId, "passport") },
              ]}
            />
          </Panel>

          <div style={{ display: "grid", gridTemplateColumns: vp.isCompact ? "1fr" : "1fr 1fr", gap: vp.gutter }}>
            <Panel>
              <PanelHeader title="Source Evidence" />
              <div>
                {f.sourceEvidenceIds.map((eid) => (
                  <button
                    key={eid}
                    onClick={() => navigate(ROUTES.evidenceAsset(eid))}
                    style={{
                      display: "flex", alignItems: "center", gap: 9, width: "100%", textAlign: "left",
                      padding: "10px 4px", background: "transparent", border: "none",
                      borderBottom: "1px solid rgba(22,38,60,0.7)", cursor: "pointer", minHeight: 44,
                    }}
                  >
                    <span style={{ fontFamily: T.font.mono, fontSize: 11.5, color: T.color.bluePale, flex: 1 }}>{eid}</span>
                    <span style={{ color: T.color.blueBright, fontSize: 11 }}>›</span>
                  </button>
                ))}
              </div>
            </Panel>

            <Panel>
              <PanelHeader title="Analysis & Review" accent="gold" />
              {analysis ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Fact label="Analysis" value={analysis.analysisId} mono />
                  <Fact label="Type" value={analysis.analysisType} />
                  <Fact label="Model" value={analysis.modelName + " " + analysis.modelVersion} mono />
                  <Fact label="Analysis Version" value={analysis.analysisVersion} mono />
                  <Fact label="Completed" value={analysis.completedAt ? relTime(analysis.completedAt) : "—"} />
                  <Fact label="Review State" value={f.reviewState} />
                  <Fact label="Passport State" value={f.passportState} />
                  <Fact label="Created" value={relTime(f.createdAt)} />
                </div>
              ) : (
                <EmptyState title="No analysis linked" hint="This finding is not attached to a Cortex analysis." />
              )}
            </Panel>
          </div>

          <Panel>
            <PanelHeader title="Prediction vs Reality" />
            {prediction ? (
              <div style={{ display: "grid", gridTemplateColumns: vp.isPhone ? "1fr" : "1fr 1fr", gap: 14 }}>
                <div>
                  <Label style={{ marginBottom: 8 }}>Predicted</Label>
                  <Fact label="Condition" value={prediction.predictedCondition} />
                  <div style={{ height: 10 }} />
                  <Fact label="Confidence" value={(prediction.confidence * 100).toFixed(0) + "%"} />
                  <div style={{ height: 10 }} />
                  <Fact label="Predicted At" value={shortDate(prediction.predictedAt)} />
                </div>
                <div>
                  <Label style={{ marginBottom: 8 }}>Later Verified</Label>
                  {prediction.verification ? (
                    <>
                      <Fact label="Result" value={prediction.verification.result} tone={prediction.verification.result === "CONFIRMED" ? "ok" : undefined} />
                      <div style={{ height: 10 }} />
                      <Fact label="Observed" value={prediction.verification.verifiedCondition} />
                      <div style={{ height: 10 }} />
                      <Fact label="Verified At" value={shortDate(prediction.verification.verifiedAt)} />
                    </>
                  ) : (
                    <div style={{ fontFamily: T.font.body, fontSize: 11.5, color: T.color.textMute, lineHeight: 1.5 }}>
                      Not yet verified. This prediction is recorded so that a future capture or a contractor tear-off can
                      confirm or refute it. Nothing is claimed until that happens.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <EmptyState
                title="No prediction record"
                hint="Prediction tracking applies to probable findings that make a claim about future or hidden condition."
              />
            )}
          </Panel>
        </div>
      )}
    </Resource>
  );
}
