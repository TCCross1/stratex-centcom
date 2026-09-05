export function shellFromPacket(packet, page, title) {
  return {
    title,
    packageLine: packet?.titlePackage,
    reportId: packet?.reportId,
    page,
    pageCount: packet?.totalPages || 27,
    passportSyncedAt: packet?.passportSyncedAt,
    nextScanLabel: packet?.nextScanLabel,
    nextScanDetail: packet?.nextScanDetail,
    reviewComplete: !!packet?.reviewComplete,
    operator: packet?.operator,
  };
}
