import CreatePlaidLink from "../components/Plaid/PlaidLink";
import PageHeader from "../components/common/PageHeader";

export default async function ConnectPage() {

  return (
    <>
      <PageHeader title="Accounts" description="Linked institutions and which accounts count toward your budget." />
      <CreatePlaidLink />
    </>
  )

}
