import styles from "./inputsBlock.module.css";
import InputText from "./inputText";

interface Props {
  h3: string;
  lText: string;
  lName: string;
  rText: string;
  rName: string;
}

export default function InputsBlock({ h3, lText, lName, rText, rName }: Props) {
  return (
    <div className={styles.input_block}>
      <h3 className={styles.input_block_header}>{h3}</h3>
      <div className={styles.input_wrapper}>
        <InputText name={lName} text={lText} />
        <InputText name={rName} text={rText} />
      </div>
    </div>
  );
}
