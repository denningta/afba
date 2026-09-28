import BudgetNavigator from "./components/budget/BudgetNavigator";
import PageHeader from "./components/common/PageHeader";

export default function Home() {
  return (
    <PageHeader
      title="Dashboard"
      description="Pick a month to open its budget."
      actions={<BudgetNavigator />}
    />
  );
}
