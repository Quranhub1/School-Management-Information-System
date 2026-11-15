declare module 'jsbarcode' {
  type JsBarcodeOptions = {
    format?: string;
    width?: number;
    height?: number;
    displayValue?: boolean;
    fontSize?: number;
    margin?: number;
    background?: string;
    lineColor?: string;
    textMargin?: number;
  };

  function JsBarcode(element: SVGElement, value: string, options?: JsBarcodeOptions): SVGElement;
  export default JsBarcode;
}
