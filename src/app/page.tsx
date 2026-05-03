export default function Home() {
  return (
    <form action="http://localhost:3000/api/request_handler" method="POST">
      <input type="hidden" name="region" value="heimatar" />
      <button type="submit">send region</button>
    </form>
  );
}
