import { useState, useEffect } from "react";
import { formatDate, formatNumberWithSpaces } from './Utils';

const WorkSheet = ({ onBuyerChange, onContractChange, onDateChange, onFormTypeChange, onIsIncreaseSumChange, onPaymentTermChange, onTotalDebtChange, onTotalIncreaseSumChange, onDocumentsChange, onSelectedDocumentsChange, onPenaltyRateChange, onTaxNumberChange, onTotalPenaltySumChange }) => {

    const [buyer, setBuyer] = useState(""); 
    const [taxNumber, setTaxNumber] = useState("");
    const [contract, setContract] = useState(""); 
    const [formType, setFormType] = useState("2020");
    const [paymentTerm, setPaymentTerm] = useState("");
    const [penaltyRate, setPenaltyRate] = useState("0,15%");
    const [isIncreaseSum, setIsIncreaseSum] = useState(true);

    // const [currentDate, setCurrentDate] = useState(Date);

    const [currentDate, setCurrentDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split("T")[0]; // Форматируем как 'YYYY-MM-DD'
    });

    const handleCurrentDate = (e) => {
        const newDate = e.target.value;
        setCurrentDate(newDate);
        onDateChange(newDate);
    
        recalculatePenaltySum();   // Пересчитываем все значения при изменении текущей даты
    };


    const [checkedRows, setCheckedRows] = useState({});
    const [rows, setRows] = useState([{ id: Date.now(), sum: "", document: "", shipmentDate: "", penaltyDays: "", paymentDate: "", checked: false }]);
    
    
    const handleBuyerChange = (e) => {
        setBuyer(e.target.value);
        onBuyerChange(e.target.value);  // Передача значения в родительский компонент
    };

    const handleTaxNumberChange = (e) => {
        setTaxNumber(e.target.value);
        onTaxNumberChange(e.target.value);
    };

    const handleContractChange = (e) => {
        setContract(e.target.value);
        onContractChange(e.target.value);  // Передача значения в родительский компонент
    };

    const handleFormTypeChange = (e) => {
        setFormType(e.target.value);
        onFormTypeChange(e.target.value);
    };

    const handlePenaltyRate = (e) => {
        const newPenaltyRate = e.target.value; 
    setPenaltyRate(newPenaltyRate); // Обновляем локальное состояние
    onPenaltyRateChange(newPenaltyRate); // Передаем новое значение в родительский компонент
    };

     const handleIncreaseSum = () => {
         const statusIsIncreaseSum = !isIncreaseSum;
         setIsIncreaseSum(statusIsIncreaseSum);
         onIsIncreaseSumChange(statusIsIncreaseSum ? "checked" : "unchecked");
     };
    
     const addDaysToDate = (date, days) => {
         const result = new Date(date);
         result.setDate(result.getDate() + days); // Добавляем 1 день
         return result.toISOString().split('T')[0];  // Преобразуем в формат YYYY-MM-DD
     };

    const handleShipmentDateChange = (index, value) => {
        const updatedRows = [...rows];
        updatedRows[index].shipmentDate = value;

        // Рассчитываем дату платежа, если введена дата отгрузки и срок оплаты
        if (updatedRows[index].shipmentDate && paymentTerm) {
            const paymentTermDays = parseInt(paymentTerm);
            updatedRows[index].paymentDate = addDaysToDate(value, paymentTermDays);
        }

        setRows(updatedRows);
        recalculatePenaltySum();
    };

    const handlePaymentTermChange = (e) => {
        setPaymentTerm(e.target.value);
        onPaymentTermChange(e.target.value);

        const updatedRows = [...rows];
        updatedRows.forEach((row, index) => {
            if (row.shipmentDate) {
                const paymentTermDays = parseInt(e.target.value);
                updatedRows[index].paymentDate = addDaysToDate(row.shipmentDate, paymentTermDays);
            }
        });
        setRows(updatedRows);
        recalculatePenaltySum();
    };
    
    const calculateDaysDifference = (paymentDate, currentDate) => {
        if (!paymentDate) return ""; // Если дата платежа не определена, возвращаем пустую строку
       
        const paymentDateObject = new Date(paymentDate); // Преобразуем строку даты платежа в объект даты
        const currentDateObject = new Date(currentDate); // Используем текущее значение даты, переданное как параметр
        
        // Проверяем корректность обеих дат
        if (isNaN(paymentDateObject.getTime())) {
            return ""; // Если дата платежа некорректна, возвращаем пустую строку
        }
    
        // Рассчитываем разницу в миллисекундах и переводим в дни
        const diffInMilliseconds = currentDateObject - paymentDateObject;
        const diffInDays = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24)); // Округляем до целого числа
       
  
        return diffInDays < 0 ? 0 : diffInDays; // Если разница отрицательная (платеж в будущем), возвращаем 0
    };

    const calculatePenalty = (sum, days, penaltyRate) => {
        if (!sum || !days || !penaltyRate) return 0;
    
        // Преобразуем строку неустойки в число
        const penaltyRateNumber = parseFloat(penaltyRate.replace('%', '').replace(',', '.')) / 100;
    
        // Расчет неустойки по формуле
        return sum * days * penaltyRateNumber;
        
    };
    
    // Рассчитываем общую сумму неустойки
    const totalPenaltySum = rows.reduce((total, row) => {
        const days = calculateDaysDifference(row.paymentDate, currentDate); // Рассчитываем количество дней
        const penalty = calculatePenalty(row.sum, days, penaltyRate); // Рассчитываем неустойку для строки
        return total + penalty;
    }, 0);

    const handleSumChange = (index, value) => {
        const updatedRows = [...rows];
    
       // Обновляем значение строки напрямую без преобразования
    updatedRows[index].sum = value; 
    setRows(updatedRows);
    recalculatePenaltySum();
    };

    // Функция для форматирования и преобразования при потере фокуса
    const formatInputOnBlur = (index, value) => {
    const updatedRows = [...rows];

    // Заменяем запятую на точку и удаляем пробелы
    const cleanedValue = value.replace(/\s/g, '').replace(',', '.');

    // Преобразуем в число
    const parsedValue = parseFloat(cleanedValue);

    // Обновляем значение строки, если это корректное число
    if (!isNaN(parsedValue)) {
        updatedRows[index].sum = parsedValue.toFixed(2); // Форматируем с двумя знаками после запятой
    }

    setRows(updatedRows);

    // Пересчитываем общую сумму
    const totalSum = updatedRows.reduce((acc, row) => acc + (parseFloat(row.sum) || 0), 0);
    onTotalDebtChange(totalSum);
};

    const recalculatePenaltySum = () => {
        const totalPenaltySum = rows.reduce((total, row) => {
            const days = calculateDaysDifference(row.paymentDate, currentDate); // Рассчитываем количество дней
            const penalty = calculatePenalty(row.sum, days, penaltyRate); // Рассчитываем неустойку для строки
            
            return total + penalty;
        }, 0);
        onTotalPenaltySumChange(totalPenaltySum); // Обновляем общую сумму неустойки в родительском компоненте
    };
    
    // Обработчик изменения состояния чекбокса (10%)
    const handleCheckboxChange = (index, checked) => {
    const updatedRows = [...rows];
    updatedRows[index].checked = checked;
    setRows(updatedRows);

    // Обновляем все документы и отмеченные документы
    updateDocuments(updatedRows);
};

const handleDocumentChange = (index, value) => {
        const updatedRows = [...rows];
        updatedRows[index].document = value;  
        setRows(updatedRows);
        
        updateDocuments(updatedRows);
    };
 

// Обновление всех документов и отмеченных документов
const updateDocuments = (updatedRows) => {
    const allDocuments = updatedRows.map(row => ({ document: row.document, checked: row.checked }));
    const checkedDocuments = allDocuments.filter(doc => doc.checked);  // Только отмеченные документы

    onDocumentsChange(allDocuments);  // Передаем все документы в App
    onSelectedDocumentsChange(checkedDocuments);  // Передаем только отмеченные документы
};

    const addRow = () => {
        setRows([...rows, { id: Date.now(), sum: 0, document: "", shipmentDate: "", penaltyDays: "", checked: false }]);
        recalculatePenaltySum();
    };

    const removeRow = (id) => {
        const updatedRows = rows.filter(row => row.id !== id);
        setRows(updatedRows);
        // Обновляем список документов и передаем его
   
        updateDocuments(updatedRows);  // Обновляем список документов

        recalculatePenaltySum();
        const totalSum = updatedRows.reduce((acc, row) => acc + row.sum, 0);
        onTotalDebtChange(totalSum); 
    };

    const totalIncreaseSum = rows.reduce((acc, row) => {
        if (row.checked) {  // Используйте row.checked вместо checkedRows[index]
            return acc + (row.sum / 10);
        }
        return acc;
    }, 0);

    // Передача суммы в родительский компонент
    useEffect(() => {
        onTotalIncreaseSumChange(totalIncreaseSum);
    }, [totalIncreaseSum, onTotalIncreaseSumChange]);

     useEffect(() => {
         const totalPenaltySum = rows.reduce((acc, row) => {
             const days = calculateDaysDifference(row.paymentDate, currentDate);
             const penaltyForRow = calculatePenalty(row.sum, days, penaltyRate);
         return acc + penaltyForRow;
         }, 0);
         onTotalPenaltySumChange(totalPenaltySum);  // Передаем рассчитанное значение в App
     }, [rows, penaltyRate, currentDate, onTotalPenaltySumChange]);

    
    return(<div className="data">

        <div className='line'>
           <h3>Покупатель:</h3>
           <input 
           type="text" 
           placeholder="форма и наименование"
           value={buyer}
           onChange={handleBuyerChange}
           />
           <h3>ИНН:</h3>
           <input 
           type="text" 
           placeholder="ИНН Покупателя"
           value={taxNumber}
           onChange={handleTaxNumberChange}
           />
        </div> 

        <div className='line'>
           <h3>Договор: </h3>
           <input 
           type="text"
           placeholder="номер и дата договора"
           value={contract}
           onChange={handleContractChange}/>
      
           <h3>ТФ: </h3>
           <form>
                <label>
                <input 
                type="radio" 
                name="contract" 
                value="2020"
                checked={formType === "2020"}
                onChange={handleFormTypeChange} 
                /> 2020 
                </label>
                <label>
                <input 
                    type="radio" 
                    name="contract" 
                    value="2014" 
                    checked={formType === "2014"}
                    onChange={handleFormTypeChange} 
                    /> 2014 
                </label>
            </form>
         </div>


<div className='line'>
           <h3>Срок оплаты: </h3>
           <label>
            <input
                className="inputDays"
                type="text"
                value={paymentTerm}
                onChange={handlePaymentTermChange} />
           </label>
           </div>

           <div className="straf-container line">
           <h3>Неустойка: </h3>
                <div className="peni-options">
                    <select className="peni-select" value={penaltyRate} onChange={handlePenaltyRate}>
                        <option>0,15%</option>
                        <option>0,10%</option>
                    </select>
                </div>
            
                <h3>Увеличение стоимости: </h3>
                <div>
                <input 
                    type="checkbox" 
                    className="straf-select" 
                    checked={isIncreaseSum} 
                    onChange={handleIncreaseSum}
                    />
                </div>
           </div>

            <div className="line">
            <h3>Расчет произвести по состоянию на: </h3>
            <input 
            type="date" 
            value={currentDate}
            onChange={handleCurrentDate} />
            </div> 

           <h4>ОТГРУЗКИ: </h4>
                <table>
                    <thead>
                        <tr>
                            <th className={isIncreaseSum ? "thClass" : "block"}>10%</th>
                            <th>Дата отгрузки</th>
                            <th>УПД/Акт</th>
                            <th>Сумма</th>
                            <th>Дата платежа</th>
                            <th>Срок</th>
                            <th>Сумма неустойки</th>
                            <th className={isIncreaseSum ? "thClass" : "block"}>Сумма 10%</th>
                            <th>-/+</th>
                        </tr>
                    </thead>

                    <tbody>
                    {rows.map((row, index) => {
                        const days = calculateDaysDifference(row.paymentDate, currentDate); // Рассчитываем разницу в днях
                        const penalty = calculatePenalty(row.sum, days, penaltyRate); // Рассчитываем неустойку для строки
                       
                        return (
                            <tr key={row.id}>
            
                            <td className={isIncreaseSum ? "tdClass" : "block"}>
                            <input 
                                    type="checkbox"
                                    checked={row.checked}  // Привязка к состоянию строки
                                    onChange={(e) => handleCheckboxChange(index, e.target.checked)}  
                                />
                            </td>

                            <td><input 
                            type="date" 
                            value={row.shipmentDate}
                            onChange={(e) => handleShipmentDateChange(index, e.target.value)}
                            /></td>

                            <td>
                            <input
                                    className="calculateInput"
                                    type="text"
                                    value={row.document}  // Значение для УПД/Акт
                                    onChange={(e) => handleDocumentChange(index, e.target.value)}  // Обработчик изменения
                                />
                                </td>
                            
                            <td>
                            <input
                                className="sumInput"
                                type="text"
                                value={row.sum} // Оставляем текущее значение для ввода пользователем
                                onChange={(e) => handleSumChange(index, e.target.value)} // Обработка изменений во время ввода
                                onBlur={(e) => formatInputOnBlur(index, e.target.value)} // Форматирование при потере фокуса
                            />
                            </td>
                            
                            <td className="dateDuty">{row.paymentDate ? formatDate(row.paymentDate) : ""}</td>
                            <td className="daysPenalty">{days}</td>
                            <td className="sumPenalty">{penalty.toFixed(2)}</td>
                            <td className={isIncreaseSum ? "tdClass" : "block"}>{row.checked ? (row.sum / 10).toFixed(2) : '0'}</td>
                            <td>
                                <button className="delete-row-button" onClick={() => removeRow(row.id)}>x</button>
                            </td>
                        </tr>
                    );
                })}
                    </tbody>
                </table>
                <button onClick={addRow} className="add-row-button">Добавить отгрузку</button>
        
           
            <div>
            <h4>Сумма долга: {formatNumberWithSpaces(
    rows.reduce((sum, row) => sum + (parseFloat(row.sum.toString().replace(',', '.')) || 0), 0)
)} p.</h4>
                <h4>Сумма неустойки: {formatNumberWithSpaces(totalPenaltySum.toFixed(2))} p.</h4>
                <h4 className={isIncreaseSum ? "line" : "block"}>Сумма 10%: {formatNumberWithSpaces(totalIncreaseSum)} p.</h4>
            </div>
        
    </div>
    )
}

export default WorkSheet;