import { CountryEmissionsTable } from './components/CountryEmissionsTable';
import { Layout } from './components/Layout';
import { NetworkPowerStats } from './components/NetworkPowerStats';
import { ValidatorStats } from './components/ValidatorStats';

function App() {
  return (
    <Layout>
      <ValidatorStats />
      <NetworkPowerStats />
      <CountryEmissionsTable />
    </Layout>
  );
}

export default App;
