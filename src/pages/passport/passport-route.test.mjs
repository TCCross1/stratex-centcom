import assert from 'node:assert/strict';
import { Screen } from '../../app/Screen.jsx';

const overviewRoute = '/passport/SXP-004182/overview';
const overviewElement = Screen({ route: overviewRoute, navigate: () => {}, session: {} });
assert.ok(overviewElement, 'screen should render a Passport route element');
assert.equal(overviewElement.type && overviewElement.type.name, 'PassportDetail', 'passport detail route should render PassportDetail');

const deepRoutes = [
  ['/passport/SXP-004182/revisions/r2', 'PassportRevisionDetail'],
  ['/passport/SXP-004182/ingestions/PI-1', 'PassportIngestionReview'],
  ['/passport/SXP-004182/conflicts/PCF-1', 'PassportConflictReview'],
  ['/passport/SXP-004182/projections/core', 'PassportProjectionInspector'],
];

for (const [route, expectedType] of deepRoutes) {
  const element = Screen({ route, navigate: () => {}, session: {} });
  assert.ok(element, 'screen should render a Passport deep-link element for ' + route);
  assert.equal(element.type && element.type.name, expectedType, 'deep-link route should render the expected review detail component for ' + route);
}

console.log('RESULT Passport route model OK');
