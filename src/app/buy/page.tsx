import styles from "./buy.module.css";
import OptionBar from "../components/optionsBar";
export default function Buy() {
  return (
    <section>
      <OptionBar />
      <div className={`${styles.container} container`}>
        <div className={styles.settingsInfo}></div>
        <table></table>
      </div>
    </section>
  );
}
