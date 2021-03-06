import 'braft-editor/dist/index.css';
import React, { Component } from 'react';
import BraftEditor from 'braft-editor';
import { ContentUtils } from 'braft-utils';
import { Form, Input, Button, Card, Radio, message, Upload, Icon, Modal } from 'antd';
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import { save, get } from '@/services/article';
// import MonacoEditor from 'react-monaco-editor';

const FormItem = Form.Item;

class Edit extends Component {
  state = {
    id: undefined,
    type: 'html',
  };

  componentDidMount() {
    const {
      match: {
        params: { id },
      },
      form,
    } = this.props;
    if (id && id.match(/^\d+$/)) {
      get({ id }).then(response => {
        if (response.success && response.data) {
          const { title, note, type, text, rawJson } = response.data;
          this.setState({ id, type });
          const html = type === 'html' ? BraftEditor.createEditorState(rawJson) : undefined;
          const markdown = type === 'markdown' ? text : undefined;
          form.setFieldsValue({
            title,
            note,
            html,
            markdown,
          });
        }
      });
    }
  }

  handleSubmit = event => {
    event.preventDefault();

    this.props.form.validateFields(
      {
        force: true,
      },
      (err, values) => {
        if (!err) {
          const { title, note, html, markdown } = values;
          const { id, type } = this.state;
          let text;
          let rawJson;
          if (type === 'html' && html) {
            text = html.toHTML();
            rawJson = html.toRAW();
          }
          if (type === 'markdown' && markdown) {
            text = markdown;
          }
          const submitData = { title, note, type, text, rawJson, id };
          save(submitData).then(response => {
            if (response.success) {
              message.success('操作成功！');
              if (!id) {
                // 增加文章的情况下删除输入内容
                this.props.form.setFieldsValue({
                  title: null,
                  note: null,
                  html: type === 'html' ? BraftEditor.createEditorState(null) : undefined,
                  markdown: undefined,
                })
              }
            } else {
              message.error('操作失败请重试！');
            }
          });
        }
      },
    );
  };

  changeType = type => {
    Modal.confirm({
      title: '改变类型',
      content: '改变文章类型不会保存之前的内容，确定继续吗',
      okText: '确定',
      cancelText: '取消',
      onOk: () => this.setState({ type }),
    });
  };

  uploadImage = ({ file }) => {
    if (file.status !== 'done') return;
    if (file.response.success) {
      const { setFieldsValue, getFieldValue } = this.props.form;
      const oldContent = getFieldValue('html') || BraftEditor.createEditorState(null);
      const newContent = ContentUtils.insertMedias(oldContent, [
        {
          type: 'IMAGE',
          url: file.response.data,
        },
      ]);
      setFieldsValue({
        html: newContent,
      });
      message.success('图片上传成功！');
    } else {
      message.error('图片上传失败！');
    }
  };

  preview = e => {
    if (window.previewWindow) {
      window.previewWindow.close();
    }
    window.previewWindow = window.open();
    window.previewWindow.document.write(this.buildPreviewHtml(e));
    window.previewWindow.document.close();
  };

  buildPreviewHtml() {
    return `
      <!Doctype html>
      <html>
        <head>
          <title>Preview Content</title>
          <style>
            html,body{
              height: 100%;
              margin: 0;
              padding: 0;
              overflow: auto;
              background-color: #f1f2f3;
            }
            .container{
              box-sizing: border-box;
              width: 1000px;
              max-width: 100%;
              min-height: 100%;
              margin: 0 auto;
              padding: 30px 20px;
              overflow: hidden;
              background-color: #fff;
              border-right: solid 1px #eee;
              border-left: solid 1px #eee;
            }
            .container img,
            .container audio,
            .container video{
              max-width: 100%;
              height: auto;
            }
            .container p{
              white-space: pre-wrap;
              min-height: 1em;
            }
            .container pre{
              padding: 15px;
              background-color: #f1f1f1;
              border-radius: 5px;
            }
            .container blockquote{
              margin: 0;
              padding: 15px;
              background-color: #f1f1f1;
              border-left: 3px solid #d1d1d1;
            }
          </style>
        </head>
        <body>
          <div class="container">${this.props.form.getFieldValue('html') &&
            this.props.form.getFieldValue('html').toHTML()}</div>
          <ul><li>133333</li></ul>
          <ol><li>133333</li></ol>
          <h1>hello</h1>
          <h2>hello</h2>
          <h3>hello</h3>
          <h4>hello</h4>
          <h5>hello</h5>
          <h6>hello</h6>
          
        </body>
      </html>
    `;
  }

  render() {
    const { id, type } = this.state;
    const { form } = this.props;
    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24,
        },
        sm: {
          span: 2,
        },
      },
      wrapperCol: {
        xs: {
          span: 24,
        },
        sm: {
          span: 6,
        },
        md: {
          span: 8,
        },
      },
    };
    const submitFormLayout = {
      wrapperCol: {
        xs: {
          span: 24,
        },
        sm: {
          span: 10,
          offset: 2,
        },
      },
    };

    return (
      <PageHeaderWrapper>
        <Card
          bordered={false}
          title={
            <h1 style={{ textAlign: 'center', marginBottom: '0' }}>
              {id ? '修改文章' : '增加文章'}
            </h1>
          }
        >
          <Form
            hideRequiredMark
            {...formItemLayout}
            onSubmit={this.handleSubmit}
            style={{
              marginTop: 8,
            }}
          >
            <FormItem label="文章标题">
              {getFieldDecorator('title', {
                rules: [
                  {
                    required: true,
                    message: '请输入标题',
                  },
                ],
              })(<Input size="large" placeholder="请输入标题" />)}
            </FormItem>
            <FormItem label="文章备注">
              {getFieldDecorator('note')(<Input size="large" placeholder="可输入备注" />)}
            </FormItem>
            <FormItem label="文章类型">
              <Radio.Group onChange={e => this.changeType(e.target.value)} value={type} disabled={!!id}>
                <Radio.Button value="html">Html富文本</Radio.Button>
                <Radio.Button value="markdown">Markdown文本</Radio.Button>
              </Radio.Group>
            </FormItem>
            {type === 'html' ? (
              <FormItem
                label="文章正文"
                labelCol={{
                  xs: {
                    span: 24,
                  },
                  sm: {
                    span: 2,
                  },
                }}
                wrapperCol={{
                  xs: {
                    span: 24,
                  },
                  sm: {
                    span: 22,
                  },
                  md: {
                    span: 22,
                  },
                }}
              >
                {getFieldDecorator('html', {
                  validateTrigger: 'onBlur',
                  rules: [
                    {
                      required: true,
                      validator: (_, value, callback) => {
                        if (!value || value.isEmpty()) {
                          callback('请输入正文内容');
                        } else {
                          callback();
                        }
                      },
                    },
                  ],
                })(
                  <BraftEditor
                    className="my-editor"
                    placeholder="请输入正文内容"
                    extendControls={[
                      {
                        key: 'preview-button',
                        type: 'button',
                        text: '预览',
                        onClick: this.preview,
                      },
                      {
                        key: 'uploader',
                        type: 'component',
                        component: (
                          <Upload
                            name="img"
                            action="/api/oss/img"
                            accept="image/*"
                            showUploadList={false}
                            onChange={this.uploadImage}
                          >
                            <button
                              type="button"
                              className="control-item button"
                              data-title="插入图片"
                            >
                              <Icon type="picture" theme="filled" />
                            </button>
                          </Upload>
                        ),
                      },
                    ]}
                    excludeControls={['media']}
                    style={{ border: '1px solid #d9d9d9', borderRadius: '4px' }}
                  />,
                )}
              </FormItem>
            ) : (
              <FormItem
                label="文章正文"
                labelCol={{
                  xs: {
                    span: 24,
                  },
                  sm: {
                    span: 2,
                  },
                }}
                wrapperCol={{
                  xs: {
                    span: 24,
                  },
                  sm: {
                    span: 22,
                  },
                  md: {
                    span: 22,
                  },
                }}
              >
                {getFieldDecorator('markdown', {
                  validateTrigger: 'onBlur',
                  rules: [
                    {
                      required: true,
                      message: '请输入内容',
                    },
                  ],
                })(<Input.TextArea allowClear rows="25" wrap="hard" />)}
              </FormItem>
            )}
            {/* <MonacoEditor width="800" height="600" language="markdown" theme="vs-dark" /> */}
            <FormItem {...submitFormLayout}>
              <Button
                size="large"
                type="primary"
                htmlType="submit"
                style={{
                  marginLeft: 8,
                  marginTop: 8,
                }}
              >
                提交
              </Button>
            </FormItem>
          </Form>
        </Card>
      </PageHeaderWrapper>
    );
  }
}

export default Form.create()(Edit);
