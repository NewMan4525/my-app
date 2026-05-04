import styles from "./home.module.css";

export default function Home() {
  return (
    <section>
      <div className={`${styles.container} container`}>
        <div className={styles.input_stat_block}>
          <h3 className={styles.input_stat_header}>Caldari</h3>
          <div className={styles.description_input_wrapper}>
            <p>Caldari state to you</p> <input type="number" />
          </div>
        </div>
      </div>
    </section>
  );
}
