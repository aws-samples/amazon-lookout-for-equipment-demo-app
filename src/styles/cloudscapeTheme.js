const theme = {
  name: "cloudscape",
  tokens: {
    fonts: {
      default: {
        variable: "Open Sans",
        static: "Open Sans"
      }
    },
    components: {
      button: {
        borderRadius: "20px",
        paddingBlockStart: "4px",
        paddingBlockEnd: "4px",
        paddingInlineStart: "20px",
        paddingInlineEnd: "20px",
        fontSize: "14px",
        borderWidth: "2px",
        borderColor: "#0972d3",
        color: "#0972d3",
        _hover: {
          borderColor: "#033160",
          backgroundColor: "#f2f8fd",
          color: "#033160"
        },
        primary: {
          backgroundColor: "#0972d3",
          _hover: {
            backgroundColor: "#033160"
          }
        },
        link: {
            backgroundColor: "#FFFFFF",
            color: "#545b64",
            fontWeight: "bold",
            _hover: {
                fontWeight: "bold",
                backgroundColor: "#033160"
            }
        }
      },
      alert: {
        alignItems: "flex-start",
        paddingBlock: "12px",
        paddingInline: "16px",
        heading: {
          fontSize: "14px"
        },
        icon: {
          size: "16px"
        },
        info: {
          color: "#000716",
          backgroundColor: "#f2f8fd"
        }
      }
    }
  }
};

export default theme;
