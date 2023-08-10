/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import * as echarts from 'echarts'

export var colorPalette = [
    '#529ccb', '#a32952', '#67a353', '#6b40b2', '#e07941', '#014a87', '#da7596', '#125502', '#a783e1', '#7e3103', 
    '#0273bb', '#8b1b42', '#1f8104', '#59309d', '#bc4d01', '#003c75', '#c33d69', '#0f4601', '#8456ce', '#692801', 
    '#015b9d', '#780d35', '#176702', '#4a238b', '#983c02'
];

var theme = {
    color: colorPalette,

    title: {
        textStyle: {
            fontWeight: 'normal',
            color: '#414D5C'
        }
    },

    visualMap: {
        itemWidth: 15,
        color: ['#5ab1ef', '#e0ffff']
    },

    toolbox: {
        itemSize: 20,
        iconStyle: {
            borderColor: colorPalette[4],
            borderWidth: 2,
            shadowColor: colorPalette[4],
            shadowBlur: 0,
            opacity: 0.5
        },
        emphasis: {
            iconStyle: {
                borderColor: colorPalette[7],
                shadowColor: colorPalette[7],
                shadowBlur: 4,
                opacity: 1.0
            }
        }
    },

    tooltip: {
        borderWidth: 0,
        backgroundColor: 'rgba(50,50,50,0.5)',
        textStyle: {
            color: '#FFF'
        },
        axisPointer: {
            type: 'line',
            lineStyle: {
                color: '#414D5C'
            },
            crossStyle: {
                color: '#414D5C'
            },
            shadowStyle: {
                color: 'rgba(200,200,200,0.2)'
            }
        }
    },

    dataZoom: {
        dataBackgroundColor: '#efefff',
        fillerColor: 'rgba(182,162,222,0.2)',
        handleColor: '#414D5C'
    },

    grid: {
        borderColor: '#eee'
    },

    categoryAxis: {
        axisLine: {
            lineStyle: {
                color: '#414D5C'
            }
        },
        splitLine: {
            lineStyle: {
                color: ['#eee']
            }
        }
    },

    valueAxis: {
        axisLine: {
            lineStyle: {
                color: '#414D5C'
            }
        },
        splitArea: {
            show: true,
            areaStyle: {
                color: ['rgba(250,250,250,0.1)', 'rgba(200,200,200,0.1)']
            }
        },
        splitLine: {
            lineStyle: {
                color: ['#eee']
            }
        }
    },

    timeline: {
        lineStyle: {
            color: '#414D5C'
        },
        controlStyle: {
            color: '#414D5C',
            borderColor: '#414D5C'
        },
        symbol: 'emptyCircle',
        symbolSize: 3
    },

    line: {
        smooth: true,
        symbol: 'emptyCircle',
        symbolSize: 3
    },

    candlestick: {
        itemStyle: {
            color: '#d87a80',
            color0: '#2ec7c9'
        },
        lineStyle: {
            width: 1,
            color: '#d87a80',
            color0: '#2ec7c9'
        },
        areaStyle: {
            color: '#2ec7c9',
            color0: '#b6a2de'
        }
    },

    scatter: {
        symbol: 'circle',
        symbolSize: 4
    },

    map: {
        itemStyle: {
            color: '#ddd'
        },
        areaStyle: {
            color: '#fe994e'
        },
        label: {
            color: '#d87a80'
        }
    },

    graph: {
        itemStyle: {
            color: '#d87a80'
        },
        linkStyle: {
            color: '#2ec7c9'
        }
    },

    gauge: {
        axisLine: {
            lineStyle: {
                color: [
                    [0.2, '#2ec7c9'],
                    [0.8, '#5ab1ef'],
                    [1, '#d87a80']
                ],
                width: 10
            }
        },
        axisTick: {
            splitNumber: 10,
            length: 15,
            lineStyle: {
                color: 'auto'
            }
        },
        splitLine: {
            length: 22,
            lineStyle: {
                color: 'auto'
            }
        },
        pointer: {
            width: 5
        }
    }
};

echarts.registerTheme('macarons', theme);