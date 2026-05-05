import styles from "./inputText.module.css";

interface Props {
  text: string;
  name: string;
}
export default function InputText({ text, name }: Props) {
  return (
    <div className={styles.flex_box}>
      <div className={styles.description_input_wrapper}>
        <p>{text}</p>
        <input placeholder="0" className="input" type="number" name={name} />
      </div>
    </div>
  );
}
