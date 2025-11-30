import AxisDetailClient from "./AxisDetailClient";

type AxisParams = {
  axisCode: string;
};

export default async function AxisDetailPage({
  params,
}: {
  params: Promise<AxisParams>;
}) {
  const { axisCode } = await params;
  return <AxisDetailClient axisCode={axisCode} />;
}
