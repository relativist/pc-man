type StubPageProps = {
  title: string;
  description: string;
};

export function StubPage({ title, description }: StubPageProps) {
  return (
    <section className="page-grid">
      <div className="panel hero-headline">
        <p className="eyebrow">MVP Section</p>
        <h2>{title}</h2>
        <p className="lede">{description}</p>
      </div>
    </section>
  );
}
